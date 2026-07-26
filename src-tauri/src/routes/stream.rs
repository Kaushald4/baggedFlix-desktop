use axum::{
    body::Body,
    extract::Query,
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;

use crate::stream::proxy::proxy_link_with_referer;

#[derive(Deserialize)]
struct StreamQuery {
    url: Option<String>,
    referer: Option<String>,
}

fn request_base_url(headers: &HeaderMap) -> String {
    let host = headers
        .get(header::HOST)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("127.0.0.1:4000");

    let _scheme = headers
        .get("x-forwarded-proto")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("http");

    format!("http://{host}")
}

pub fn router() -> Router {
    Router::new()
        .route("/api/stream", get(stream_handler))
        .route("/api/proxy-stream", get(proxy_stream_handler))
}

async fn stream_handler(headers: HeaderMap, Query(q): Query<StreamQuery>) -> impl IntoResponse {
    let Some(content_url) = q.url else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Missing url parameter" })),
        )
            .into_response();
    };

    let web_url = request_base_url(&headers);

    match proxy_link_with_referer(&content_url, &web_url, q.referer.as_deref()).await {
        Ok(data) => {
            let mut resp = Response::new(Body::from(data));
            resp.headers_mut().insert(
                header::CONTENT_TYPE,
                HeaderValue::from_static("application/vnd.apple.mpegurl"),
            );
            resp.headers_mut().insert(
                header::ACCESS_CONTROL_ALLOW_ORIGIN,
                HeaderValue::from_static("*"),
            );
            resp
        }
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Failed to fetch stream link" })),
        )
            .into_response(),
    }
}

async fn proxy_stream_handler(Query(q): Query<StreamQuery>) -> impl IntoResponse {
    let Some(content_url) = q.url else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Missing url parameter" })),
        )
            .into_response();
    };

    let client = reqwest::Client::new();

    let mut req = client
        .get(&content_url)
        .header(
            header::USER_AGENT,
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        );

    if let Some(ref r) = q.referer {
        req = req.header(header::REFERER, r);
    }

    let upstream = match req.send().await
    {
        Ok(r) => r,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Failed to fetch stream link" })),
            )
                .into_response();
        }
    };

    let status = upstream.status();
    let content_type = upstream.headers().get(header::CONTENT_TYPE).cloned();
    let content_length = upstream.headers().get(header::CONTENT_LENGTH).cloned();

    let stream = upstream.bytes_stream();

    let mut resp = Response::new(Body::from_stream(stream));
    *resp.status_mut() = status;

    resp.headers_mut().insert(
        header::ACCESS_CONTROL_ALLOW_ORIGIN,
        HeaderValue::from_static("*"),
    );

    resp.headers_mut().insert(
        header::CONTENT_TYPE,
        content_type.unwrap_or_else(|| HeaderValue::from_static("application/octet-stream")),
    );

    if let Some(cl) = content_length {
        resp.headers_mut().insert(header::CONTENT_LENGTH, cl);
    }

    resp
}
