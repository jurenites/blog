import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let source_url = URL(fileURLWithPath: CommandLine.arguments[1])
let output_url = URL(fileURLWithPath: CommandLine.arguments[2])
let request_handler = VNImageRequestHandler(url: source_url, options: [:])
let foreground_request = VNGeneratePersonInstanceMaskRequest()
try request_handler.perform([foreground_request])
guard let mask_observation = foreground_request.results?.first else { fatalError("No foreground mask found") }
let instance_buffer = mask_observation.instanceMask
CVPixelBufferLockBaseAddress(instance_buffer, .readOnly)
let buffer_width = CVPixelBufferGetWidth(instance_buffer)
let buffer_height = CVPixelBufferGetHeight(instance_buffer)
let buffer_stride = CVPixelBufferGetBytesPerRow(instance_buffer)
let buffer_bytes = CVPixelBufferGetBaseAddress(instance_buffer)!.assumingMemoryBound(to: UInt8.self)
let person_index = Int(buffer_bytes[Int(Double(buffer_height) * 0.60) * buffer_stride + Int(Double(buffer_width) * 0.48)])
CVPixelBufferUnlockBaseAddress(instance_buffer, .readOnly)
guard person_index > 0 else { fatalError("The subject point is classified as background") }
let masked_buffer = try mask_observation.generateMaskedImage(ofInstances: IndexSet(integer: person_index), from: request_handler, croppedToInstancesExtent: false)
let masked_image = CIImage(cvPixelBuffer: masked_buffer)
let image_context = CIContext()
let color_space = CGColorSpace(name: CGColorSpace.sRGB)!
guard let output_image = image_context.createCGImage(masked_image, from: masked_image.extent, format: .RGBA8, colorSpace: color_space),
      let image_destination = CGImageDestinationCreateWithURL(output_url as CFURL, UTType.png.identifier as CFString, 1, nil) else { fatalError("Cannot create PNG output") }
CGImageDestinationAddImage(image_destination, output_image, nil)
guard CGImageDestinationFinalize(image_destination) else { fatalError("Cannot save PNG") }
print("Person instance: \(person_index); output: \(output_image.width)x\(output_image.height); alpha: \(output_image.alphaInfo.rawValue)")
