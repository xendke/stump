use rocket::{serde::json::Json, Route};
use serde::Serialize;

use crate::types::alias::{ApiResult, Context};

pub mod auth;
pub mod job;
pub mod library;
pub mod media;
pub mod series;

/// Function to return the routes for the `/api` path.
pub fn api() -> Vec<Route> {
	routes![
		// top level
		claim,
		// routing::api::scan,
		// routing::api::event_listener,
		// auth
		auth::me,
		auth::login,
		auth::register,
		auth::logout,
		// logs api
		// job::get_jobs,
		job::jobs_listener,
		// library api
		library::get_libraries,
		library::get_library_by_id,
		library::scan_library,
		library::create_library,
		library::update_library,
		library::delete_library,
		// series api
		series::get_series,
		series::get_series_by_id,
		series::get_series_thumbnail,
		// media api
		media::get_media,
		media::get_reading_media,
		media::get_media_by_id,
		media::get_media_file,
		media::get_media_page,
		media::get_media_thumbnail,
		media::update_media_progress,
	]
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ClaimResponse {
	is_claimed: bool,
}

// TODO: set status?
// TODO: should this explicitly check for a SERVER_OWNER? Not sure if it's needed, if
// it would be a valid scenario that a SERVER_OWNER account gets deleted but not the
// other *managed* accounts.
/// Checks whether or not the server is 'claimed,' i.e. if there is a user registered.
#[get("/claim")]
async fn claim(ctx: &Context) -> ApiResult<Json<ClaimResponse>> {
	let db = ctx.get_db();

	Ok(Json(ClaimResponse {
		is_claimed: db.user().find_first(vec![]).exec().await?.is_some(),
	}))
}