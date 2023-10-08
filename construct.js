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
function tohtml(json) {
    const entry = mkelem("div", {"className": "entry"}, [
        mkelem("p", null, [
            mkelem("b", null, [json.word]),
            " ",
            json.selmaho ? mkelem("code", {"className": "selmaho"}, [json.selmaho]) : null,
            " ",
            json.rafsi ? mkelem("code", null, [
                "[", ...json.rafsi.map(i => "-" + i), "-]"
            ]) : null,
            " ",
            mkelem("a", {
                "href": "https://jbovlaste.lojban.org/dict/" + json.word.replace(/ /g, "%20"),
                "target": "_blank"
            }, [
                json.score < -1 ? mkelem("b", {"className": "warn"}, [json.score]) :
                json.score >= 1000 ? "official" : null,
                " ↗"
            ])
        ]),
        mkelem("p", null, [json.definition]),
        json.notes ? mkelem("details", null, [
            mkelem("summary", null, ["more info"]),
            mkelem("p", null, [json.notes])
        ]) : null
    ]);
    return entry;
}