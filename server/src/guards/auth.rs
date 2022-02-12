use rocket::{
    http::Status,
    request::{FromRequest, Outcome, Request},
};

use crate::utils::auth::AuthError;
use crate::{
    database::{entities::user::AuthenticatedUser, queries::user::get_user_by_username},
    utils, State,
};

type Session<'a> = rocket_session_store::Session<'a, AuthenticatedUser>;

pub struct OpdsAuth(pub AuthenticatedUser);

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication

// FIXME: This is still really gross, there must be a neater way to handle this with all the safety checks
// than what I am doing here.
#[rocket::async_trait]
impl<'r> FromRequest<'r> for OpdsAuth {
    type Error = AuthError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let session: Session<'_> = req.guard().await.expect("TODO");

        match session.get().await {
            Ok(res) => {
                if res.is_some() {
                    println!("Session existed: {:?}", res);
                    return Outcome::Success(OpdsAuth(res.unwrap()));
                }
            }
            Err(e) => {
                return Outcome::Failure((Status::Unauthorized, AuthError::InvalidSession(e)));
            }
        };

        let state: &State = req.guard().await.expect("TODO");

        let authorization = req.headers().get_one("authorization");

        if authorization.is_none() {
            Outcome::Failure((Status::Unauthorized, AuthError::BadRequest))
        } else {
            let authorization = authorization.unwrap_or("");
            let token: String;

            println!("Authorization: {}", authorization);

            if authorization.starts_with("Basic ") {
                token = authorization.replace("Basic ", "");
            } else {
                return Outcome::Failure((Status::BadRequest, AuthError::BadRequest));
            }

            let decoded = base64::decode(token);

            if decoded.is_err() {
                return Outcome::Failure((Status::Unauthorized, AuthError::BadRequest));
            }

            let bytes = decoded.unwrap();

            let credentials = utils::auth::decode_base64_credentials(bytes);

            if credentials.is_err() {
                return Outcome::Failure((Status::Unauthorized, credentials.err().unwrap()));
            }

            let credentials = credentials.unwrap();

            let user = get_user_by_username(&credentials.username, state.get_connection()).await;

            if user.is_err() {
                return Outcome::Failure((Status::Unauthorized, AuthError::Unauthorized));
            }
            let user = user.unwrap();

            if user.is_none() {
                return Outcome::Failure((Status::Unauthorized, AuthError::Unauthorized));
            }

            let user = user.unwrap();

            let matches = utils::auth::verify_password(&user.password, &credentials.password);

            if matches.is_err() {
                Outcome::Failure((Status::Unauthorized, matches.err().unwrap()))
            } else if matches.unwrap() {
                let authed_user: AuthenticatedUser = user.into();
                session
                    .set(authed_user.clone())
                    .await
                    .expect("An error occurred while setting the session");
                Outcome::Success(OpdsAuth(authed_user))
            } else {
                Outcome::Failure((Status::Unauthorized, AuthError::Unauthorized))
            }
        }
    }
}