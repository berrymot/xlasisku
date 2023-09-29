function mkelem(tag, props, children) {
    const e = document.createElement(tag);
    Object.assign(e, props);
    for (const c of children) {
        if (c != null) {
            e.append(c);
        }
    }
    return e;
}
function mktext(s) {
    return document.createTextNode(s);
}
function tohtml(json) {
    const entry = mkelem("div", {"class": "entry"}, [
        mkelem("p", null, [
            mkelem("b", null, [mktext(json.word)]),
            mktext(" "),
            json.selmaho ? mkelem("code", {"class": "selmaho"}, [mktext(json.selmaho)]) : null,
            mktext(" "),
            json.rafsi ? mkelem("code", null, [
                mktext("["), ...(json.rafsi.map(i => "-" + i)), mktext("-]")
            ]) : null,
            mktext(" "),
            mkelem("a", {
                "href": "https://jbovlaste.lojban.org/dict/" + json.word.replace(/ /g, "%20")
            }, [
                json.score < -1 ? mkelem("b", {"class": "warn"}, [mktext(json.score)]) :
                json.score >= 1000 ? mktext("official") : null,
                mktext(" ↗")
            ])
        ]),
        mkelem("p", null, [json.definition]),
        json.notes ? mkelem("details", null, [
            mkelem("summary", null, [mktext("more info")]),
            mkelem("p", null, json.notes)
        ]) : null
    ]);
    return entry;
}