use std::{fs, time::Instant};
use xml::{attribute::OwnedAttribute, reader::{self, XmlEvent}};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    word: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    selmaho: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    rafsi: Vec<String>,
    score: i32,
    definition: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    notes: String
}
impl Entry {
    fn new() -> Self {
        Self {
            word: String::new(),
            rafsi: Vec::new(),
            selmaho: String::new(),
            score: 0,
            definition: String::new(),
            notes: String::new()
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let f = fs::File::open("../jvs/jbovlaste-en.xml")?;
    let mut reader = reader::EventReader::new(f); // we don't need the file anymore
    let mut words = Vec::<Entry>::new();
    let mut current_tag = String::new();
    let mut entry = Entry::new();
    let mut skip = false;
    loop {
        match reader.next()? {
            XmlEvent::StartDocument { .. } => {
                println!("start of xml :3");
            }
            XmlEvent::EndDocument { .. } => {
                println!("end of xml :3");
                break;
            }
            XmlEvent::StartElement { name, attributes, .. } => {
                let tagname = name.local_name.clone();
                match tagname.as_str() {
                    "valsi" => {
                        entry = Entry::new();
                        if !attr(&attributes, "type").starts_with('o') {
                            entry.word = attr(&attributes, "word");
                            skip = false;
                        } else {
                            current_tag.clear();
                            reader.skip()?;
                            skip = true;
                        }
                    }
                    "score" | "rafsi" | "selmaho" | "definition" | "notes" => {
                        current_tag = tagname;
                    }
                    _ => {
                        if tagname != "dictionary" && tagname != "direction" {
                            // we don't care about this
                            let _ = reader.skip();
                        }
                    }
                }
            }
            XmlEvent::Characters(text) => {
                match current_tag.as_str() {
                    "score" => {
                        let int = text.parse::<i32>().unwrap();
                        if int >= -1 {
                            entry.score = int;
                        } else {
                            skip = true;
                        }
                        current_tag.clear();
                    }
                    "rafsi" => {
                        entry.rafsi.push(text);
                        current_tag.clear();
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
                    _ => ()
                }
            }
            XmlEvent::EndElement { name } => {
                let tagname = name.borrow().local_name;
                if tagname == "valsi" && !skip {
                    words.push(entry.clone());
                }
            }
            _ => ()
        }
    }
    let json_str = serde_json::to_string_pretty(&words)?;
    fs::write("output.json", json_str)?;
    let duration = start.elapsed();
    println!("took {:?} s :3", duration.as_secs_f64());
    Ok(())
}

fn attr(v: &[OwnedAttribute], n: &str) -> String {
    v.iter().find(|&x| x.name.borrow().local_name == n).unwrap().value.to_string()
}