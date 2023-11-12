import {jbo} from "./jbo.js";
var rhyme, regex;
function h(t) {
    return t.replace(/[h‘’]/igu, "'");
}
function fields(json) {
    return [json.selmaho || null, json.rafsi || null, json.definition, json.word, json.glosswords || null, json.notes || null];
}
// TODO: selmaho() - parse into ↓
function selmahois(x, y) {
    const [xname, xdigit, xsub, xstar] = x;
    const [yname, ydigit, ysub, ystar] = y;
    return xname == yname && (xdigit == ydigit || xdigit == null) && (xsub == ysub || xsub == null) && (!xstar || ystar);
}
function vowels(str) {
    var the = str.toLowerCase();
    the = the.replace(/(?<=[aeoy])i/g, "ĭ").replace(/(?<=[aeoy])u/g, "ŭ");
    while (/[iu]/.test(the)) {
        the = the
        .replace(/i(?![aeiouyīū])/gu, "ī").replace(/u(?![aeiouyīū])/gu, "ū")
        .replace(/i(?=[aeoyīū])/gu, "ị").replace(/u(?=[aeīoūy])/gu, "ụ")
        ;
    }
    the = the.replace(/[^aeiouyĭŭīūịụ]/gu, "");
    return the;
}
function xusegismu_zo(g) {
    return /^[bcdfgjklmnprstvxz]([aeiou][bcdfgjklmnprstvxz]|[bcdfgjklmnprstvxz][aeiou])[bcdfgjklmnprstvxz][aeiou]$/.test(g);
}
function search(query) {
    var results = [];
    if (rhyme) {
        const v = vowels(query);
        for (const entry of jbo) {
            var text = vowels(entry.word);
            if (v != "" && text.endsWith(v)) {
                results.push([entry, -entry.word.length]);
            }
        }
    } else if (regex) {
        for (const entry of jbo) {
            var rgx;
            try {
                rgx = new RegExp(query);
            } catch (e) {
                return [];
            }
            if (rgx.test(entry.word)) {
                results.push([entry, 1]);
            }
        }
    } else {
        // exact matches
        for (const entry of jbo) {
            const text = entry.word.replace(/\s+/g, " ").replace(/&lt;/g, "<");
            if (text == h(query)) {
                results.push([entry, 10]);
                break;
            }
        }
        for (const entry of jbo) {
            for (var field of fields(entry)) {
                var score = 6 - fields(entry).indexOf(field);
                const gismubonus = xusegismu_zo(entry.word) ? 0.5 : 0;
                switch (field) {
                    case entry.word:
                        if (field.startsWith(h(query))) {
                            results.push([entry, score + 0.5 + query.length / field.length / 2]);
                        } else if (field.includes(h(query))) {
                            results.push([entry, score + query.length / field.length / 2]);
                        }
                        break;
                    case entry.rafsi:
                        if (field) {
                            score = 8;
                            for (const r of field) {
                                if (r == h(query)) {
                                    results.push([entry, score]);
                                }
                            }
                        }
                        break;
                    case entry.selmaho:
                        // const bits = selmaho(query);
                        // console.log(bits);
                        // if (field) {
                        //     if (selmahois(bits, selmaho(field))) {
                        //         results.push([html, score]);
                        //     }
                        // }
                        break;
                    case entry.glosswords:
                        if (field) {
                            for (const g of field) {
                                if (g == query) {
                                    results.push([entry, gismubonus]);
                                }
                            }
                        }
                        break;
                    default:
                        const rgx = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        if (field && new RegExp(`(^|[^\\p{L}\\p{Mc}\\p{Me}])${rgx}e?s?($|[^\\p{L}\\p{Mc}\\p{Me}])`, "iu").test(field)) {
                            results.push([entry, score + gismubonus]);
                        }
                        break;
                }
            }
        }
    }
    results = dedup(results);
    return results;
}
function dedup(list) {
    var l = list.sort((a, b) => b[1] - a[1]);
    const logged = {};
    l = l.filter(entry => {
        if (logged[entry[0].word]) return false;
        logged[entry[0].word] = true;
        return true;
    });
    return l;
}
onmessage = function(e) {
    const query = e.data.query;
    rhyme = e.data.rhyme || false;
    regex = e.data.regex || false;
    const res = search(query);
    postMessage(res);
};