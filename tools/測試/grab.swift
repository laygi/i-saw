import AVFoundation
import AppKit
let path=CommandLine.arguments[1], t=Double(CommandLine.arguments[2])!, out=CommandLine.arguments[3]
let asset=AVURLAsset(url:URL(fileURLWithPath:path))
let gen=AVAssetImageGenerator(asset:asset)
gen.appliesPreferredTrackTransform=true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
let cg=try! gen.copyCGImage(at:CMTime(seconds:t,preferredTimescale:600),actualTime:nil)
let rep=NSBitmapImageRep(cgImage:cg)
try! rep.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:out))
print("saved",out,cg.width,"x",cg.height)
