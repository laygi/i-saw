import AVFoundation
import CoreImage
import Foundation

let path = CommandLine.arguments[1]
let asset = AVURLAsset(url: URL(fileURLWithPath: path))
guard let track = asset.tracks(withMediaType: .video).first else { print("no video track"); exit(1) }
let reader = try! AVAssetReader(asset: asset)
let outp = AVAssetReaderTrackOutput(track: track, outputSettings: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(outp)
reader.startReading()

var times: [Double] = []
var colors: [(Int,Int,Int)] = []
while let sb = outp.copyNextSampleBuffer() {
  let t = CMSampleBufferGetPresentationTimeStamp(sb)
  times.append(CMTimeGetSeconds(t))
  if let px = CMSampleBufferGetImageBuffer(sb) {
    CVPixelBufferLockBaseAddress(px, .readOnly)
    let w = CVPixelBufferGetWidth(px), h = CVPixelBufferGetHeight(px)
    let bpr = CVPixelBufferGetBytesPerRow(px)
    let base = CVPixelBufferGetBaseAddress(px)!.assumingMemoryBound(to: UInt8.self)
    var r=0, g=0, b=0, n=0
    var y = 0
    while y < h { var x = 0
      while x < w {
        let o = y*bpr + x*4
        b += Int(base[o]); g += Int(base[o+1]); r += Int(base[o+2]); n += 1
        x += 16 }
      y += 16 }
    colors.append((r/n, g/n, b/n))
    CVPixelBufferUnlockBaseAddress(px, .readOnly)
  }
}
print("frames: \(times.count)  size: \(Int(track.naturalSize.width))x\(Int(track.naturalSize.height))  nominalFPS: \(track.nominalFrameRate)")
var gaps: [Double] = []
for i in 1..<times.count { gaps.append(times[i]-times[i-1]) }
let rounded = gaps.map { (round($0*10000)/10000) }
var hist: [Double: Int] = [:]
for g in rounded { hist[g, default: 0] += 1 }
print("間隔分布（秒:次數）:", hist.sorted{ $0.key < $1.key }.map{ "\($0.key)×\($0.value)" }.joined(separator: " "))
print("每格顏色（R,G,B）:")
for (i,c) in colors.enumerated() {
  print(String(format: "  #%03d %6.3fs  (%3d,%3d,%3d)", i, times[i], c.0, c.1, c.2))
}
