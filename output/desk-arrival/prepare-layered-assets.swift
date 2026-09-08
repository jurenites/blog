import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
let output_width = 1600
let output_height = 900
func prepare_asset(_ source_path:String,_ target_path:String,_ is_foreground:Bool) {
 let source_provider=CGImageSourceCreateWithURL(URL(fileURLWithPath:source_path) as CFURL,nil)!
 let source_image=CGImageSourceCreateImageAtIndex(source_provider,0,nil)!
 let image_context=CGContext(data:nil,width:output_width,height:output_height,bitsPerComponent:8,bytesPerRow:output_width*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 image_context.translateBy(x:0,y:900)
 image_context.scaleBy(x:1,y:-1)
 image_context.translateBy(x:800,y:450)
 image_context.scaleBy(x:1.09,y:1.09)
 image_context.translateBy(x:-800,y:-450)
 if is_foreground {
  image_context.concatenate(CGAffineTransform(a:1.024179747,b:-0.010061603,c:0.021220512,d:1.019932268,tx:-84.708944,ty:-34.338069))
 }
 let drawn_height = is_foreground ? 900.0 : 1600.0*Double(source_image.height)/Double(source_image.width)
 let drawn_offset = (900.0-drawn_height)/2
 image_context.translateBy(x:0,y:drawn_offset+drawn_height)
 image_context.scaleBy(x:1,y:-1)
 image_context.draw(source_image,in:CGRect(x:0,y:0,width:1600,height:drawn_height))
 let target_type = is_foreground ? UTType.png : UTType.jpeg
 let image_destination=CGImageDestinationCreateWithURL(URL(fileURLWithPath:target_path) as CFURL,target_type.identifier as CFString,1,nil)!
 CGImageDestinationAddImage(image_destination,image_context.makeImage()!,[kCGImageDestinationLossyCompressionQuality:0.88] as CFDictionary)
 precondition(CGImageDestinationFinalize(image_destination))
 print(target_path)
}
prepare_asset("output/desk-arrival/empty-desk-cold.png","src/public/assets/images/desk-arrival-background.jpg",false)
prepare_asset("output/desk-arrival/person-back-cold.png","src/public/assets/images/desk-arrival-person.png",true)
