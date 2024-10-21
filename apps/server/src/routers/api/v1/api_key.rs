use axum::{
	extract::{Path, Request, State},
	middleware::{self, Next},
	response::{Json, Response},
	routing::get,
	Extension, Router,
};
use chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};
use specta::Type;
use stump_core::{
	db::entity::{APIKey, APIKeyPermissions, UserPermission},
	prisma::{api_key, user},
};

use crate::{
	config::state::AppState,
	errors::{APIError, APIResult},
	middleware::auth::{auth_middleware, RequestContext},
};

pub(crate) fn mount(app_state: AppState) -> Router<AppState> {
	Router::new()
		.nest(
			"/api-keys",
			Router::new()
				.route("/", get(get_api_keys).post(create_api_key))
				.route(
					"/:id",
					get(get_api_key).put(update_api_key).delete(delete_api_key),
				),
		)
		.layer(middleware::from_fn(authorize)) // Note the order!
		.layer(middleware::from_fn_with_state(app_state, auth_middleware))
}

/// A secondary authorization middleware to ensure that the user has access to the
/// API key management endpoints. This is purely for convenience
async fn authorize(req: Request, next: Next) -> APIResult<Response> {
	let ctx = req
		.extensions()
		.get::<RequestContext>()
		.ok_or(APIError::Unauthorized)?;
	ctx.enforce_permissions(&[UserPermission::AccessAPIKeys])?;
	Ok(next.run(req).await)
}

/// Get all API keys for the current user
async fn get_api_keys(
	State(ctx): State<AppState>,
	Extension(req): Extension<RequestContext>,
) -> APIResult<Json<Vec<APIKey>>> {
	let user = req.user();
	let client = &ctx.db;

	let api_keys = client
		.api_key()
		.find_many(vec![api_key::user_id::equals(user.id.clone())])
		.exec()
		.await?;
	let api_keys = api_keys
		.into_iter()
		.map(APIKey::try_from)
		.collect::<Result<Vec<APIKey>, _>>()?;

	Ok(Json(api_keys))
}

/// Get a single API key for the current user
async fn get_api_key(
	Path(id): Path<i32>,
	State(ctx): State<AppState>,
	Extension(req): Extension<RequestContext>,
) -> APIResult<Json<APIKey>> {
	let user = req.user();
	let client = &ctx.db;

	let api_key = client
		.api_key()
		.find_first(vec![
			api_key::id::equals(id),
			api_key::user_id::equals(user.id.clone()),
		])
		.exec()
		.await?;
	let api_key = api_key.ok_or(APIError::NotFound("API key not found".to_string()))?;

	Ok(Json(APIKey::try_from(api_key)?))
}

/// The request body for creating or updating an API key
#[derive(Deserialize, Type)]
pub struct CreateOrUpdateAPIKey {
	/// The permissions that the API key should have
	permissions: APIKeyPermissions,
	/// The expiration date for the API key, if any
	expires_at: Option<DateTime<FixedOffset>>,
}

/// The response after creating a new API key
#[derive(Serialize, Type)]
pub struct CreatedAPIKey {
	/// The fully qualified prefixed API key. This is what the user will provide to
	/// authenticate and authorize requests. This **is not** stored in the database,
	/// so it may only be retrieved once upon creation.
	api_key: String,
}

/// Create a new API key for the current user
async fn create_api_key(
	State(ctx): State<AppState>,
	Extension(req): Extension<RequestContext>,
	Json(body): Json<CreateOrUpdateAPIKey>,
) -> APIResult<Json<CreatedAPIKey>> {
	let user = req.user();
	let client = &ctx.db;

	if let APIKeyPermissions::Custom(permissions) = &body.permissions {
		// Ensure that the user has the requested permissions
		req.enforce_permissions(permissions).map_err(|e| {
			tracing::error!(?e, "User does not have requested permissions");
			APIError::Forbidden("You lack the required permissions".to_string())
		})?;
	};

	let permissions = serde_json::to_vec(&body.permissions).map_err(|e| {
		tracing::error!(?e, "Failed to serialize permissions");
		APIError::BadRequest("Invalid permissions requested".to_string())
	})?;

	let (pek, hash) = APIKey::create_prefixed_key()?;
	let _api_key = client
		.api_key()
		.create(
			pek.short_token().to_string(),
			hash,
			permissions,
			user::id::equals(user.id.clone()),
			vec![api_key::expires_at::set(body.expires_at)],
		)
		.exec()
		.await?;

	Ok(Json(CreatedAPIKey {
		api_key: pek.to_string(),
	}))
}

/// Update an existing API key for the current user
async fn update_api_key(
	Path(id): Path<i32>,
	State(ctx): State<AppState>,
	Extension(req): Extension<RequestContext>,
	Json(body): Json<CreateOrUpdateAPIKey>,
) -> APIResult<Json<APIKey>> {
	let user = req.user();
	let client = &ctx.db;

	let api_key = client
		.api_key()
		.find_first(vec![
			api_key::id::equals(id),
			api_key::user_id::equals(user.id.clone()),
		])
		.exec()
		.await?
		.ok_or(APIError::NotFound("API key not found".to_string()))?;

	if let APIKeyPermissions::Custom(permissions) = &body.permissions {
		// Ensure that the user has the requested permissions
		req.enforce_permissions(permissions).map_err(|e| {
			tracing::error!(?e, "User does not have requested permissions");
			APIError::Forbidden("You lack the required permissions".to_string())
		})?;
	};

	let permissions = serde_json::to_vec(&body.permissions).map_err(|e| {
		tracing::error!(?e, "Failed to serialize permissions");
		APIError::BadRequest("Invalid permissions requested".to_string())
	})?;

	let updated_api_key = client
		.api_key()
		.update(
			api_key::id::equals(api_key.id),
			vec![
				api_key::permissions::set(permissions),
				api_key::expires_at::set(body.expires_at),
			],
		)
		.exec()
		.await?;

	Ok(Json(APIKey::try_from(updated_api_key)?))
}

/// Delete an existing API key for the current user
async fn delete_api_key(
	Path(id): Path<i32>,
	State(ctx): State<AppState>,
	Extension(req): Extension<RequestContext>,
) -> APIResult<()> {
	let user = req.user();
	let client = &ctx.db;

	let api_key = client
		.api_key()
		.find_first(vec![
			api_key::id::equals(id),
			api_key::user_id::equals(user.id.clone()),
		])
		.exec()
		.await?
		.ok_or(APIError::NotFound("API key not found".to_string()))?;

	let _deleted_key = client
		.api_key()
		.delete(api_key::id::equals(api_key.id))
		.exec()
		.await?;

	Ok(())
}