use latkerlo_jvotci::*;
use notoize::notoize;
use regex::Regex;
use reqwest::blocking;
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, fs, io::Cursor, time::Instant};
use xml::{
    attribute::OwnedAttribute,
    reader::{self, XmlEvent},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    word: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    selmaho: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    rafsi: Vec<String>,
    score: i32,
    definition: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    notes: String,
    #[serde(skip)]
    pos: String,
    #[serde(skip)]
    author: String,
    #[serde(skip)]
    lang: String,
}
impl Entry {
    fn new() -> Self {
        Self {
            word: String::new(),
            rafsi: Vec::new(),
            selmaho: String::new(),
            score: 0,
            definition: String::new(),
            notes: String::new(),
            pos: String::new(),
            author: String::new(),
            lang: String::new(),
        }
    }
    fn to_datastring(&self) -> String {
        let mut s = self.word.to_owned();
        // regex replacements
        s = Regex::new(r"[. ]")
            .unwrap()
            .replace_all(&s, "_")
            .to_string();
        s = Regex::new(r"^_|_$")
            .unwrap()
            .replace_all(&s, "")
            .to_string();
        s = Regex::new(r"_+").unwrap().replace_all(&s, "_").to_string();
        // we get rid of obsolete words and non-experimental words have a vote boost anyway
        s = s + " " + self.pos.split(' ').nth(1).unwrap_or(&self.pos);
        if !self.selmaho.is_empty() {
            s = s + " " + &self.selmaho;
        }
        if !self.rafsi.is_empty() {
            s = s + " [-" + &self.rafsi.join("-") + "-]";
        }
        s = s
            + " "
            + &Regex::new(r"[^a-z0-9]")
                .unwrap()
                .replace_all(&self.author.to_lowercase(), "");
        s = s + " " + self.score.to_string().as_str();
        s = s + "\n" + &self.definition;
        if !self.notes.is_empty() {
            s = s + "\n-n\n" + &self.notes;
        }
        s
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let start = Instant::now();
    // parse the xml
    let langs = [
        "en",
        "am",
        "ar",
        "art-guaspi",
        "art-loglan",
        "be",
        "bg",
        "br",
        "ca",
        "ch",
        "cs",
        "cy",
        "da",
        "de",
        "el",
        "en-bpfk",
        "en-simple",
        "eo",
        "es",
        "et",
        "eu",
        "fa",
        "fi",
        "fr-facile",
        "fr",
        "ga",
        "gl",
        "gu",
        "he",
        "hi",
        "hr",
        "hu",
        "ia",
        "id",
        "it",
        "ja",
        "jbo",
        "ka",
        "ko",
        "kw",
        "la",
        "lt",
        "lv",
        "mg",
        "ne",
        "nl",
        "no",
        "pl",
        "pt-br",
        "pt",
        "ro",
        "ru",
        "sa",
        "sk",
        "sl",
        "so",
        "sq",
        "sr",
        "sv",
        "ta",
        "test",
        "tlh",
        "tok",
        "tpi",
        "tr",
        "uk",
        "vi",
        "wa",
        "zh",
    ];
    let mut words = Vec::<Entry>::new();
    let mut current_tag = String::new();
    let mut entry = Entry::new();
    let mut skip = false;
    let client = blocking::Client::new();
    let mut naljvo = Vec::<String>::new();
    for lang in langs {
        println!("`{lang}`");
        let xml = client.get(format!("https://jbovlaste.lojban.org/export/xml-export.html?lang={lang}&positive_scores_only=0&bot_key=z2BsnKYJhAB0VNsl")).send()?.bytes()?;
        let mut reader = reader::EventReader::new(Cursor::new(xml));
        loop {
            match reader.next()? {
                XmlEvent::EndDocument { .. } => {
                    break;
                }
                XmlEvent::StartElement {
                    name, attributes, ..
                } => {
                    let tagname = name.local_name;
                    match tagname.as_str() {
                        "valsi" => {
                            entry = Entry::new();
                            entry.lang = lang.to_string();
                            if !attr(&attributes, "type").starts_with('o')
                                && ![
                                    ".i",
                                    ".iklkitu",
                                    "madagasikara",
                                    "kamro",
                                    "lacpa",
                                    "matce",
                                    "burseldamri",
                                    "ka'ei'u",
                                    "lo'ei",
                                    "datru",
                                    "li'anmi",
                                ]
                                .contains(&attr(&attributes, "word").as_str())
                            {
                                entry.word = attr(&attributes, "word");
                                entry.pos = attr(&attributes, "type");
                                skip = false;
                                if attr(&attributes, "type").starts_with('l')
                                    && get_veljvo(&entry.word).is_err()
                                {
                                    naljvo.push(entry.clone().word);
                                }
                            } else {
                                current_tag.clear();
                                reader.skip()?;
                                skip = true;
                            }
                        }
                        "score" | "rafsi" | "selmaho" | "definition" | "notes" | "username" => {
                            current_tag = tagname;
                        }
                        "dictionary" | "direction" | "user" => {
                            // go inside
                        }
                        _ => {
                            reader.skip()?;
                        }
                    }
                }
                XmlEvent::Characters(text) => {
                    match current_tag.as_str() {
                        "score" => {
                            let int = text.parse::<i32>()?;
                            if int >= -1 {
                                entry.score = int;
                            } else {
                                skip = true;
                            }
                        }
                        "rafsi" => {
                            entry.rafsi.push(text);
                        }
                        "selmaho" => {
                            entry.selmaho = text;
                        }
                        "definition" => {
                            entry.definition = text;
                        }
                        "notes" => {
                            entry.notes = text;
                        }
                        "username" => {
                            entry.author = text;
                        }
                        _ => (),
                    }
                    current_tag.clear();
                }
                XmlEvent::EndElement { name } => {
                    let tagname = name.local_name;
                    if tagname == "valsi" && !skip {
                        words.push(entry.clone());
                    }
                }
                _ => (),
            }
        }
    }
    // remove duplicates
    let mut unique = HashSet::new();
    words.retain(|word| unique.insert(word.word.clone()));
    let mut unique = HashSet::new();
    naljvo.retain(|v| unique.insert(v.clone()));
    // write
    // allwords.txt
    println!("allwords.txt");
    let mut all = String::new();
    for word in &words {
        all = all + &word.lang + "   " + &word.word + "\n";
    }
    fs::write("../data/allwords.txt", all)?;
    // jbo.js
    println!("jbo.js");
    let json_str = serde_json::to_string(&words)?;
    fs::write("../data/jbo.js", "const jbo = ".to_owned() + &json_str)?;
    // data.txt
    println!("data.txt");
    let mut data = "---".to_string();
    for word in words {
        data = data + "\n" + word.to_datastring().as_str() + "\n---";
    }
    fs::write("../data/data.txt", &data)?;
    // chars.txt, fonts
    println!("chars.txt");
    let chars: String = {
        let mut v = data.chars().collect::<Vec<char>>();
        v.sort();
        v.dedup();
        v.into_iter().collect()
    };
    fs::write("../data/chars.txt", &chars)?;
    println!("fonts/");
    let fonts = notoize(chars.as_str()).files();
    fs::remove_dir_all(".notoize").unwrap();
    for font in fonts {
        fs::write(format!("../fonts/{}", font.filename), font.bytes)?;
    }
    let _ = fs::remove_file("../fonts/NotoFangsongKSSRotated.otf");
    // naljvo.txt
    println!("naljvo.txt");
    let mut naljvo_string = String::new();
    for v in &naljvo {
        naljvo_string = naljvo_string + "\n" + &v;
    }
    fs::write("../data/naljvo.txt", naljvo_string)?;
    // .i mulno .ui
    let duration = start.elapsed();
    println!("done :3 took {:?} s", duration.as_secs_f64());
    Ok(())
}

fn attr(v: &[OwnedAttribute], n: &str) -> String {
    v.iter()
        .find(|&x| x.name.local_name == n)
        .unwrap()
        .value
        .to_string()
}
