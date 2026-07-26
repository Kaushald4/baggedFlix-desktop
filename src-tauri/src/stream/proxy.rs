use reqwest::Client;
use url::Url;
use urlencoding::encode;

fn rewrite_m3u8_urls(
    m3u8_text: &str,
    base_url: &str,
    web_url: &str,
    referer: Option<&str>,
) -> Result<String, url::ParseError> {
    let base = Url::parse(base_url)?;
    let referer_param = referer.map(|r| format!("&referer={}", encode(r))).unwrap_or_default();

    let mut out = String::with_capacity(m3u8_text.len());
    for (idx, line) in m3u8_text.lines().enumerate() {
        if idx > 0 {
            out.push('\n');
        }

        let trimmed = line.trim();

        if trimmed.starts_with('#') || trimmed.is_empty() {
            out.push_str(line);
            continue;
        }

        let absolute_url = base.join(trimmed)?.to_string();
        let encoded = encode(&absolute_url);

        if absolute_url.contains(".m3u8") {
            out.push_str(&format!("{web_url}/api/stream?url={encoded}{referer_param}&.m3u8"));
        } else {
            out.push_str(&format!("{web_url}/api/proxy-stream?url={encoded}{referer_param}&.ts"));
        }
    }

    Ok(out)
}

pub async fn proxy_link(
    link: &str,
    web_url: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync + 'static>> {
    proxy_link_with_referer(link, web_url, None).await
}

pub async fn proxy_link_with_referer(
    link: &str,
    web_url: &str,
    referer: Option<&str>,
) -> Result<String, Box<dyn std::error::Error + Send + Sync + 'static>> {
    let client = Client::new();

    let mut req = client.get(link).header(
        "User-Agent",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    );

    if let Some(r) = referer {
        req = req.header("Referer", r);
    }

    let response = req.send().await?.text().await?;

    let rewritten = rewrite_m3u8_urls(&response, link, web_url, referer)?;

    Ok(rewritten)
}
