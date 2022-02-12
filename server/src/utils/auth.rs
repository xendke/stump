use rocket_session_store::SessionError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Error during the authentication process")]
    BcryptError(#[from] bcrypt::BcryptError),
    #[error("Missing or malformed credentials")]
    BadCredentials,
    #[error("The Authorization header could no be parsed")]
    BadRequest,
    #[error("Unauthorized")]
    Unauthorized,
    #[error("The session is not valid")]
    InvalidSession(#[from] SessionError),
}

pub fn verify_password(hash: &str, password: &str) -> Result<bool, AuthError> {
    Ok(bcrypt::verify(password, hash)?)
}

pub struct DecodedCredentials {
    pub username: String,
    pub password: String,
}

pub fn decode_base64_credentials(bytes: Vec<u8>) -> Result<DecodedCredentials, AuthError> {
    let decoded = String::from_utf8(bytes).unwrap_or("".to_string());

    let username = decoded.split(":").next().unwrap_or("").to_string();
    let password = decoded.split(":").skip(1).next().unwrap_or("").to_string();

    if username.is_empty() || password.is_empty() {
        return Err(AuthError::BadCredentials);
    }

    Ok(DecodedCredentials { username, password })
}