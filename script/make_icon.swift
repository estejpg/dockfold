import AppKit
import ImageIO
import UniformTypeIdentifiers
let destination = CommandLine.arguments[1]
let size = NSSize(width: 1024, height: 1024)
// Use exact pixels: NSImage.lockFocus doubles resolution on Retina displays,
// producing a 2048px image that the ICNS writer cannot encode.
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: 1024, pixelsHigh: 1024, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSColor(calibratedWhite: 0.97, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 64, y: 64, width: 896, height: 896), xRadius: 200, yRadius: 200).fill()
NSColor(calibratedWhite: 0.06, alpha: 1).setStroke()
let frame = NSBezierPath(roundedRect: NSRect(x: 260, y: 245, width: 504, height: 544), xRadius: 52, yRadius: 52)
frame.lineWidth = 28; frame.stroke()
NSColor(calibratedWhite: 0.06, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 320, y: 425, width: 164, height: 294), xRadius: 14, yRadius: 14).fill()
NSBezierPath(roundedRect: NSRect(x: 540, y: 310, width: 164, height: 294), xRadius: 14, yRadius: 14).fill()
NSGraphicsContext.restoreGraphicsState()
guard let cg = bitmap.cgImage,
      let out = CGImageDestinationCreateWithURL(URL(fileURLWithPath: destination) as CFURL, UTType.icns.identifier as CFString, 1, nil) else { fatalError("Cannot generate icon") }
CGImageDestinationAddImage(out, cg, nil)
guard CGImageDestinationFinalize(out) else { fatalError("Cannot save icon") }
