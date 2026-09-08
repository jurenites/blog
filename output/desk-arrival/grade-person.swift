import Foundation
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let source_url = URL(fileURLWithPath: CommandLine.arguments[1])
let output_url = URL(fileURLWithPath: CommandLine.arguments[2])
let token_text = try String(contentsOfFile: CommandLine.arguments[3], encoding: .utf8)
func token_color(_ token_name: String) -> [Double] {
  let source_line = token_text.components(separatedBy:"\n").first { $0.trimmingCharacters(in:.whitespaces).hasPrefix(token_name+":") }!
  let hex_value = source_line.components(separatedBy:"\"")[1].dropFirst()
  let numeric_value = UInt32(hex_value,radix:16)!
  return [Double((numeric_value >> 16)&255)/255,Double((numeric_value >> 8)&255)/255,Double(numeric_value&255)/255]
}
let gray_color = token_color("light-gray")
let edge_color = token_color("background-edge-color")
let gray_luminance = gray_color[0]*0.2126+gray_color[1]*0.7152+gray_color[2]*0.0722
let channel_gains = gray_color.map { 0.60 + 0.40*$0/gray_luminance }
let source_image = CIImage(contentsOf:source_url)!
let image_extent = source_image.extent
let smooth_image = source_image.applyingFilter("CINoiseReduction",parameters:["inputNoiseLevel":0.06,"inputSharpness":0.20])
let neutral_image = smooth_image.applyingFilter("CIColorControls",parameters:["inputSaturation":0,"inputBrightness":0.012,"inputContrast":1.06])
let lifted_image = neutral_image.applyingFilter("CIGammaAdjust",parameters:["inputPower":0.86])
let graded_image = lifted_image.applyingFilter("CIColorMatrix",parameters:[
 "inputRVector":CIVector(x:channel_gains[0],y:0,z:0,w:0),
 "inputGVector":CIVector(x:0,y:channel_gains[1],z:0,w:0),
 "inputBVector":CIVector(x:0,y:0,z:channel_gains[2],w:0),
 "inputBiasVector":CIVector(x:edge_color[0],y:edge_color[1]*0.25,z:edge_color[2]*0.25,w:0)
])
let image_context = CIContext(options:[.workingColorSpace:CGColorSpace(name:CGColorSpace.sRGB)!])
let image_width = Int(image_extent.width)
let image_height = Int(image_extent.height)
let color_space = CGColorSpace(name:CGColorSpace.sRGB)!
var source_pixels = [UInt8](repeating:0,count:image_width*image_height*4)
var graded_pixels = source_pixels
image_context.render(source_image,toBitmap:&source_pixels,rowBytes:image_width*4,bounds:image_extent,format:.RGBA8,colorSpace:color_space)
image_context.render(graded_image,toBitmap:&graded_pixels,rowBytes:image_width*4,bounds:image_extent,format:.RGBA8,colorSpace:color_space)
var alpha_corrections = 0
for pixel_index in stride(from:0,to:graded_pixels.count,by:4) {
 let source_alpha = source_pixels[pixel_index+3]
 let graded_alpha = graded_pixels[pixel_index+3]
 if source_alpha != graded_alpha {alpha_corrections += 1}
 for channel_index in 0..<3 {
  if source_alpha == 0 {graded_pixels[pixel_index+channel_index] = 0}
  else if graded_alpha > 0 {
   graded_pixels[pixel_index+channel_index] = UInt8(min(255,Double(graded_pixels[pixel_index+channel_index])*Double(source_alpha)/Double(graded_alpha)))
  }
 }
 graded_pixels[pixel_index+3] = source_alpha
}
let pixel_data = Data(graded_pixels) as CFData
let image_provider = CGDataProvider(data:pixel_data)!
let output_image = CGImage(width:image_width,height:image_height,bitsPerComponent:8,bitsPerPixel:32,bytesPerRow:image_width*4,space:color_space,bitmapInfo:CGBitmapInfo(rawValue:CGImageAlphaInfo.premultipliedLast.rawValue),provider:image_provider,decode:nil,shouldInterpolate:true,intent:.defaultIntent)!
let image_destination = CGImageDestinationCreateWithURL(output_url as CFURL,UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(image_destination,output_image,nil)
guard CGImageDestinationFinalize(image_destination) else {fatalError("PNG save failed")}
print("Graded \(image_width)x\(image_height); original alpha restored exactly; corrected alpha pixels: \(alpha_corrections); RGB gains: \(channel_gains)")
