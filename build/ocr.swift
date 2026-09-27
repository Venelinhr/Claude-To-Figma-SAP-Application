// ocr.swift — macOS Vision text reader for build/see.py (compiled once to build/.bin/ocr).
//   ocr <image.png> [lang,lang,…]   → JSON: [{text, conf, x, y, w, h, words:[{t,x,y,w,h}]}] in image px, top-left origin
// Vision reads Cyrillic (ru/uk), German, English and more; tesseract here has English only.
import Foundation
import Vision
import ImageIO

let args = CommandLine.arguments
guard args.count > 1,
      let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { print("[]"); exit(1) }
let W = Double(cg.width), H = Double(cg.height)
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false          // keep prices, times and codes exactly as drawn
req.recognitionLanguages = (args.count > 2 ? args[2] : "ru-RU,en-US,de-DE").split(separator: ",").map(String.init)
req.minimumTextHeight = 0.006
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])

func box(_ b: CGRect) -> [String: Double] {
  ["x": (b.minX * W).rounded(), "y": ((1 - b.maxY) * H).rounded(), "w": (b.width * W).rounded(), "h": (b.height * H).rounded()]
}
var out: [[String: Any]] = []
for o in req.results ?? [] {
  guard let c = o.topCandidates(1).first else { continue }
  var words: [[String: Any]] = []
  let s = c.string
  var i = s.startIndex
  while i < s.endIndex {                     // split on spaces, keep punctuation and symbols with their word
    while i < s.endIndex && s[i] == " " { i = s.index(after: i) }
    var j = i
    while j < s.endIndex && s[j] != " " { j = s.index(after: j) }
    if i < j, let bb = try? c.boundingBox(for: i..<j) { var w: [String: Any] = box(bb.boundingBox); w["t"] = String(s[i..<j]); words.append(w) }
    i = j
  }
  var line: [String: Any] = box(o.boundingBox)
  line["text"] = s; line["conf"] = Double(c.confidence); line["words"] = words
  out.append(line)
}
let data = try JSONSerialization.data(withJSONObject: out, options: [])
print(String(data: data, encoding: .utf8)!)
