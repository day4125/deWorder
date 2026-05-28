window.DeworderDefaults = {
  ALLOWED_TARGETS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "blockquote", "li", "ul", "ol",
    "em", "strong",
    "strip", "keep",
  ],

  AUTO_STRIP_CLASSES: new Set([
    "MsoCommentText",
    "MsoCommentReference",
    "MsoCommentSubject",
    "msocomanchor",
    "msocomoff",
    "msocomtxt",
  ]),

  STRIPPED_ATTRS: new Set([
    "style", "lang", "xml:lang",
    "align", "valign", "width", "height", "bgcolor",
    "border", "cellpadding", "cellspacing",
    "link", "vlink", "alink",
  ]),

  // Used when config.json cannot be fetched (e.g. file:// mode).
  FALLBACK_CONFIG: {
    mapping: {
      MsoNormal: "p",
      NoKRubrik1: "h1",
      NoKRubrik2: "h2",
      NoKRubrik3: "h3",
      NoKRubrik4: "h4",
      NoKRubrik5: "h5",
      NoKText: "p",
      NoKIngress: "p",
      NoKPunktlista: "li",
      NoKTextIndrag: "p",
      NoKBildtext: "p",
      NoKArbetsinfo: "p",
      NoKBetoningFet: "strong",
      NoKBetoningFetFrg: "p",
      NoKBetoningKursiv: "em",
      NoKCitat: "p",
    },
    strip_all_classes: true,
    table_mode: "keep",
    disallowed_tags: [
      "img", "svg", "ins", "del", "script", "style", "iframe", "object", "embed", "hr",
      "meta", "link", "base", "noscript",
      "form", "input", "button", "textarea", "select", "option", "label", "fieldset", "legend",
      "frame", "frameset", "applet",
      "audio", "video", "source", "track", "canvas", "map", "area",
    ],
  },
};
