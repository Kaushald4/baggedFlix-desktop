use crate::stream::{
    decoder::{add_stream_host, get_stream_link},
    proxy::proxy_link,
};

use regex::Regex;
use reqwest::Client;
use scraper::{Html, Selector};

pub async fn extract_stream_link(
    id: &str,
    content_type: &str,
    season: Option<u32>,
    episode: Option<u32>,
    web_url: &str,
) -> Result<Option<String>, Box<dyn std::error::Error + Send + Sync + 'static>> {
    let url = if content_type == "movie" {
        format!("https://vidsrc-embed.ru/embed/movie/{id}")
    } else {
        let s = season.ok_or("season required")?;
        let e = episode.ok_or("episode required")?;
        format!("https://vidsrc-embed.ru/embed/tv/{id}/{s}-{e}")
    };

    let client = Client::new();

    /* ---------------- first request ---------------- */

    let res1 = client
        .get(&url)
        // .header("Host", "vidsrc-embed.ru")
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        )
        .send()
        .await?
        .text()
        .await?;



    let first_full_link = {
        let document = Html::parse_document(&res1);
        let iframe_selector = Selector::parse("#player_iframe").unwrap();

        let iframe_src = document
            .select(&iframe_selector)
            .next()
            .and_then(|el| el.value().attr("src"))
            .ok_or("iframe src not found")?
            .to_string();

        format!("https:{iframe_src}")
    };

    /* ---------------- second request ---------------- */

    let res2 = client
        .get(&first_full_link)
        .header("Host", "cloudnestra.com")
        .header("Referer", &url)
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        )
        .send()
        .await?
        .text()
        .await?;

    let re = Regex::new(r#"src\s*:\s*['"](\/prorcp\/[A-Za-z0-9+/=-]+)['"]"#)?;
    let caps = re.captures(&res2).ok_or("iframe path not found")?;
    let iframe_path = caps.get(1).unwrap().as_str();

    let full_iframe_link = format!("https://cloudnestra.com{iframe_path}");

    /* ---------------- third request ---------------- */

    let res3 = client
        .get(&full_iframe_link)
        .header("Host", "cloudnestra.com")
        .header("Referer", &full_iframe_link)
        .header(
            "User-Agent",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        )
        .send()
        .await?
        .text()
        .await?;

    let (encoded_id, encoded_str) = {
        let doc3 = Html::parse_document(&res3);
        let hidden_selector = Selector::parse(r#"div[style*="none"]"#).unwrap();

        match doc3.select(&hidden_selector).next() {
            None => {
                println!("ℹ️ hidden div not found, continuing with empty values");
                (String::new(), String::new())
            }
            Some(hidden_div) => {
                let encoded_str = hidden_div.text().collect::<String>().trim().to_string();

                let encoded_id = hidden_div.value().attr("id").unwrap_or("").to_string();

                if encoded_str.contains("Wrong Video") || encoded_str.contains("Sent report") {
                    println!("⚠️ Ignoring UI hidden div");
                    (String::new(), String::new())
                } else {
                    (encoded_id, encoded_str)
                }
            }
        }
    };

    /* ---------------- decode stream ---------------- */
    println!(
        "encoded_id: {:?} (len={}), encoded_str: {:?} (len={})",
        encoded_id,
        encoded_id.len(),
        encoded_str,
        encoded_str.len()
    );

    let final_link = if encoded_id.is_empty() || encoded_str.is_empty() {
        println!("Encoded values missing, falling back to regex extraction");
        // Fallback: regex extraction
        let regex = Regex::new(
        r"https://(?:tmstr\d*)\.\{v\d+\}/(?:pl|cdnstr)/[A-Za-z0-9._\-]+/(?:master\.m3u8|list\.m3u8)"
    ).map_err(|_| "invalid regex")?;

        let first_url = regex
            .find_iter(&res3)
            .inspect(|m| println!("matched: {}", m.as_str()))
            .map(|m| m.as_str())
            .next()
            .ok_or("no stream url found")?;

        add_stream_host(&first_url)
    } else {
        println!("Using decoder with extracted encoded values");
        // Decode using hidden values
        let stream_links = get_stream_link(&encoded_id, &encoded_str).ok_or("decoder failed")?;

        stream_links
            .split("or")
            .next()
            .map(str::trim)
            .ok_or("no stream link")?
            .to_string()
    };

    /* ---------------- proxy m3u8 ---------------- */
    let proxied = proxy_link(&final_link, web_url).await?;

    Ok(Some(proxied))
}
