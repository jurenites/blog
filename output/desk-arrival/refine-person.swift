import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let source_url = URL(fileURLWithPath: CommandLine.arguments[1])
let output_url = URL(fileURLWithPath: CommandLine.arguments[2])
guard let image_source = CGImageSourceCreateWithURL(source_url as CFURL, nil),
      let source_image = CGImageSourceCreateImageAtIndex(image_source, 0, nil) else { fatalError("Cannot decode photograph") }
let image_width = source_image.width
let image_height = source_image.height
let person_path = CGMutablePath()
func move_point(_ x_value: CGFloat, _ y_value: CGFloat) { person_path.move(to: CGPoint(x:x_value,y:y_value)) }
func line_point(_ x_value: CGFloat, _ y_value: CGFloat) { person_path.addLine(to: CGPoint(x:x_value,y:y_value)) }
func curve_point(_ first_x: CGFloat,_ first_y: CGFloat,_ second_x: CGFloat,_ second_y: CGFloat,_ end_x: CGFloat,_ end_y: CGFloat) {
  person_path.addCurve(to:CGPoint(x:end_x,y:end_y),control1:CGPoint(x:first_x,y:first_y),control2:CGPoint(x:second_x,y:second_y))
}
// Hand-traced silhouette in the inspected 1600 x 900 photograph coordinates.
// A fixed matte preserves original pixels and excludes the bright screen halo.
move_point(623,264)
curve_point(622,227,626,189,642,159)
curve_point(650,137,668,116,692,104)
curve_point(710,91,735,84,759,91)
curve_point(785,91,819,107,840,122)
curve_point(869,142,878,164,883,199)
curve_point(889,231,882,264,875,285)
curve_point(868,298,867,323,858,337)
curve_point(853,345,845,345,842,343)
curve_point(835,365,827,391,832,425)
line_point(833,443)
curve_point(850,447,863,454,875,459)
curve_point(895,469,907,479,931,480)
curve_point(953,482,971,497,979,509)
curve_point(1015,527,1038,555,1055,588)
curve_point(1065,607,1075,634,1093,642)
curve_point(1101,635,1115,616,1125,609)
curve_point(1130,604,1135,598,1144,596)
curve_point(1150,582,1165,568,1181,562)
curve_point(1184,552,1191,545,1198,548)
curve_point(1207,550,1204,558,1195,567)
curve_point(1204,565,1214,560,1224,559)
curve_point(1233,557,1238,562,1234,568)
line_point(1212,584)
curve_point(1223,580,1233,573,1242,573)
curve_point(1249,573,1253,578,1247,583)
line_point(1226,597)
curve_point(1234,594,1245,589,1251,591)
curve_point(1258,594,1258,600,1252,604)
line_point(1227,614)
curve_point(1235,612,1244,608,1251,610)
curve_point(1258,612,1257,618,1250,621)
curve_point(1235,626,1221,627,1207,630)
curve_point(1193,637,1184,644,1174,651)
curve_point(1172,666,1166,679,1152,687)
curve_point(1135,697,1114,695,1097,694)
curve_point(1083,710,1071,728,1051,736)
curve_point(1030,745,1008,735,991,714)
curve_point(989,742,979,764,976,788)
curve_point(972,812,963,820,968,839)
curve_point(970,863,960,887,959,910)
line_point(542,910)
curve_point(535,878,535,846,530,820)
curve_point(524,790,518,756,517,726)
curve_point(488,722,460,709,450,688)
curve_point(438,675,434,657,438,631)
curve_point(444,593,449,558,465,527)
curve_point(481,498,493,489,516,483)
curve_point(541,478,563,473,586,467)
curve_point(613,460,639,454,672,445)
curve_point(682,427,682,402,679,381)
curve_point(676,361,670,344,665,331)
curve_point(652,334,642,321,638,306)
curve_point(633,287,627,280,623,264)
person_path.closeSubpath()
// Keep the photographed wired earphone, without the screen pixels around it.
let cable_path = CGMutablePath()
cable_path.move(to:CGPoint(x:854,y:338))
cable_path.addCurve(to:CGPoint(x:859,y:400),control1:CGPoint(x:850,y:366),control2:CGPoint(x:862,y:381))
cable_path.addLine(to:CGPoint(x:856,y:443))
person_path.addPath(cable_path.copy(strokingWithWidth:3,lineCap:.round,lineJoin:.round,miterLimit:1))
let color_space = CGColorSpace(name: CGColorSpace.sRGB)!
let bitmap_flags = CGImageAlphaInfo.premultipliedLast.rawValue
let output_context = CGContext(data:nil,width:image_width,height:image_height,bitsPerComponent:8,bytesPerRow:image_width*4,space:color_space,bitmapInfo:bitmap_flags)!
var image_transform = CGAffineTransform(a:CGFloat(image_width)/1600,b:0,c:0,d:-CGFloat(image_height)/900,tx:0,ty:CGFloat(image_height))
output_context.addPath(person_path.copy(using:&image_transform)!)
output_context.clip()
output_context.draw(source_image,in:CGRect(x:0,y:0,width:image_width,height:image_height))
let output_image = output_context.makeImage()!
let destination_image = CGImageDestinationCreateWithURL(output_url as CFURL, UTType.png.identifier as CFString,1,nil)!
CGImageDestinationAddImage(destination_image,output_image,nil)
guard CGImageDestinationFinalize(destination_image) else { fatalError("Cannot save refined cutout") }
print("Refined original-pixel cutout: \(image_width)x\(image_height), alpha channel preserved")
