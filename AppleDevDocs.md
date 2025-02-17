App icons
A unique, memorable icon communicates the purpose and personality of your app or game and can help people recognize your product at a glance in the App Store and on their devices.
A sketch of the App Store icon. The image is overlaid with rectangular and circular grid lines and is tinted yellow to subtly reflect the yellow in the original six-color Apple logo.

Beautiful app icons are an important part of the user experience on all Apple platforms and every app and game must have one. Each platform defines a slightly different style for app icons, so you want to create a design that adapts well to different shapes and levels of detail while maintaining strong visual consistency and messaging. To download templates that help you create icons for each platform, see Apple Design Resources. For guidance on creating other types of icons, see Icons.

Best practices
Embrace simplicity. Simple icons tend to be easier for people to understand and recognize. Find a concept or element that captures the essence of your app or game, make it the core idea of the icon, and express it in a simple, unique way. Avoid adding too many details, because they can be hard to discern and can make an icon appear muddy, especially at smaller sizes. Prefer a simple background that puts the emphasis on the primary image — you don’t need to fill the entire icon with content.

Create a design that works well on multiple platforms so it feels at home on each. If your app or game runs on more than one platform, use similar images and color palettes in all icons while rendering them in the style that’s appropriate for each platform. For example, in iOS, tvOS, and watchOS, the Music app icon depicts the white musical notes on a red background using a streamlined, graphical style; macOS displays the same elements, while adding shadow that makes the notes look recessed. Similarly, the Music app icon in visionOS uses the same color scheme and content, but offers a true 3D appearance when viewed while wearing the device.

An image that shows the variations of the Music app's app icon as it appears in iOS, macOS, tvOS, visionOS, and watchOS.

Prefer including text only when it’s an essential part of your experience or brand. Text in icons is often too small to read easily, can make an icon appear cluttered, and doesn’t support accessibility or localization. In some contexts, the app name appears near the icon, making it redundant to display the name within it. Although using a mnemonic like the first letter of your app’s name can help people recognize your app or game, avoid including nonessential words that tell people what to do with it — like “Watch” or “Play” — or context-specific terms like “New” or “For visionOS.”

Prefer graphical images to photos and avoid replicating UI components in your icon. Photos are full of details that don’t work well when viewed at small sizes. Instead of using a photo, create a graphic representation of the content that emphasizes the features you want people to notice. Similarly, if your app has an interface that people recognize, don’t just replicate standard UI components or use app screenshots in your icon.

If needed, optimize your icon for the specific sizes the system displays in places like Spotlight search results, Settings, and notifications. For iOS, iPadOS, and watchOS, you can tell Xcode to generate all sizes from your 1024×1024 px App Store icon, or you can provide assets for some or all individual icon sizes. For macOS and tvOS, you need to supply all sizes; for visionOS, you supply a single 1024x1024 px asset. If you create your own versions of your app icon, make sure the image remains distinct at all sizes. For example, you might remove fine details and unnecessary features, simplifying the image and exaggerating primary features. If you need to make such changes, keep them subtle so that your app icon remains visually consistent in every context.

Two different sizes of the Safari app icon in macOS. The image on the left contains many more visual details than the image on the right.
The 512x512 px Safari app icon (on the left) uses a circle of tick marks to indicate degrees; the 16x16 px version of the icon (on the right) doesn’t include this detail.

Design your icon as a square image. On most platforms the system applies a mask that automatically adjusts icon corners to match the platform’s aesthetic. For example, visionOS and watchOS automatically apply a circular mask. Although the system applies the rounded rectangle appearance to the icon of an app created with Mac Catalyst, you need to create your macOS app icon in the correct rounded shape; for guidance, see macOS.

In most cases, design your icon with full edge-to-edge opacity. For layered app icons in visionOS and tvOS, prefer fully opaque content on the bottom layer. Note that the dark variants of iOS and iPadOS icons omit a solid background because the system provides one automatically.

For downloadable production templates that help you create app icons for each platform, see Apple Design Resources.

Consider offering an alternate app icon. In iOS, iPadOS, and tvOS, and iPadOS and iOS apps running in visionOS, people can choose an alternate version of an icon, which can strengthen their connection with the app or game and enhance their experience. For example, a sports app might offer different icons for different teams. Make sure that each alternate app icon you design remains closely related to your content and experience; avoid creating a version that people might mistake for the icon of a different app. When people want to switch to an alternate icon, they can visit your app’s settings.

Note

Alternate app icons in iOS and iPadOS require their own dark and tinted variants. As with the default app icon, all alternate and variant icons are also subject to app review and must adhere to the App Review Guidelines.

Don’t use replicas of Apple hardware products. Apple products are copyrighted and can’t be reproduced in your app icons.

Platform considerations
iOS, iPadOS
People can customize the appearance of their app icons to be light, dark, or tinted. You can create your own variations to ensure that each one looks exactly the way you way you want. See Apple Design Resources for icon templates.

An illustration of three versions of the Music app icon: light, dark, and tinted. The light version shows two white musical notes on a red gradient background. The dark version shows two red notes on a dark gradient background. The tinted version shows two grayscale notes on a dark gradient background.

Design your dark and tinted icons to feel at home next to system app icons and widgets. You can preserve the color palette of your default icon, but be mindful that dark icons are more subdued, and tinted icons are even more so. A great app icon is visible, legible, and recognizable, even with a different tint and background.

Consider a simplified version of your icon that captures its essential features. Because dark and tinted icons appear against a dark background, fine details tend to stand out more and can look messy or cluttered.

Use your light app icon as a basis for your dark icon. Choose complementary colors that reflect the default design, and avoid excessively bright images. For guidance, see Dark Mode colors. To look at home on the platform, omit the background so the system-provided background can show through.

An illustration of a pair of red musical notes against a square transparent background.
You provide a transparent dark icon.

An illustration of a square filled with a gradient of dark gray to black.
The system provides the gradient background.

An illustration of a pair of red musical notes against a rounded rectangle background.
The system composites your dark icon on the gradient background.

Provide your tinted icon as a grayscale image. Most app icons look great with a vertical gradient applied uniformly over the icon image.

An illustration of a pair of grayscale musical notes against a uniform black square background. The notes transition from a light gray at the top to a darker gray at the bottom.
You provide a fully opaque, grayscale icon.

An illustration of a square filled with a gradient of dark gray to black.
The system provides the gradient background.

An illustration of a pair of grayscale musical notes on a dark gradient background.
The system generates a tinted icon, compositing your grayscale icon on the gradient background.

In some cases, you might want to vary the opacity in other ways; for example, the Home app icon uses varying shades of gray on concentric house shapes to create contrast between the elements of the icon.

An illustration of the Home app icon in grayscale.

Don’t add an overlay or border to your Settings icon. iOS automatically adds a 1-pixel stroke to all icons so that they look good on the white background of Settings.

macOS
In macOS, app icons share a common set of visual attributes, including a rounded-rectangle shape, front-facing perspective, level position, and uniform drop shadow. Rooted in the macOS design language, these attributes showcase the lifelike rendering style people expect in macOS while presenting a harmonious user experience.

Consider depicting a familiar tool to communicate what people use your app to do. To give context to your app’s purpose, you can use the icon background to portray the tool’s environment or the items it affects. For example, the TextEdit icon pairs a mechanical pencil with a sheet of lined paper to suggest a utilitarian writing experience. After you create a detailed, realistic image of a tool, it often works well to let it float just above the background and extend slightly past the icon boundaries. If you do this, make sure the tool remains visually unified with the background and doesn’t overwhelm the rounded-rectangle shape.

An image of the TextEdit icon, depicting white paper ruled with gray horizontal lines and one red vertical line that indicates the left margin. The icon is masked to a rounded rectangle shape and includes a realistic mechanical pencil that extends beyond the edges, slanting from top-right to bottom-left.

If you depict real objects in your app icon, make them look like they’re made of physical materials and have actual mass. Consider replicating the characteristics of substances like fabric, glass, paper, and metal to convey an object’s weight and feel. For example, the Xcode app icon features a hammer that looks like it has a steel head and polymer grip.

An image of the Xcode icon showing the capital letter A formed out of three cylinders outlined in white, surrounded by a white outlined circle. The circle and letter are shown on a blue rounded rectangle background. In front of the image is a realistic image of a claw hammer, slanting to the right and extending beyond the edges.

Use the drop shadow in the icon-design template. The app-icon template includes the system-defined drop shadow that helps your app icon coordinate with other macOS icons.

Consider using interior shadows and highlights to add definition and realism. For example, the Mail app icon uses both shadows and highlights to give the envelope authenticity and to suggest that the flap is slightly open. In icons that include a tool that floats above a background — such as TextEdit or Xcode — interior shadows can strengthen the perception of depth and make the tool look real. Use shadows and highlights that suggest a light source facing the icon, positioned just above center and tilted slightly downward.

Avoid defining contours that suggest a shape other than a rounded rectangle. In rare cases, you might want to fine-tune the basic app icon shape, but doing so risks creating an icon that looks like it doesn’t belong in macOS. If you must alter the shape, prefer subtle adjustments that continue to express a rounded rectangle silhouette.

An image of the Final Cut Pro X app icon, which is an idealized version of a clapperboard. The overall shape of the icon is a rounded rectangle, even though the arm of the clapperboard is raised slightly at the top.

Keep primary content within the icon grid bounding box; keep all content within the outer bounding box. If an icon’s primary content extends beyond the icon grid bounding box, it tends to look out of place. If you overlay a tool on your icon, it works well to align the tool’s top edge with the outer bounding box and its bottom edge with the inner bounding box, as shown below. You can use the grid to help you position items within an icon and to ensure that centered inner elements like circles use a size that’s consistent with other icons in the system.

A diagram that shows various placement lines within a rounded rectangle shape. Centered in the diagram is a grid of horizontal and vertical lines, overlaid with three concentric circles and two diagonal lines. The outer boundary of the grid is a rounded rectangle labeled the icon grid bounding box. Outside the icon grid bounding box are two additional concentric rounded rectangles labeled the inner bounding box and outer bounding box. A long, narrow, shaded lozenge shape is on top of the grid, representing an approximate layout location for a tool. The tool shape extends from the inner bounding box to the outer bounding box, slanting from vertical at about 25 degrees to the right.

Specifications
App icon attributes
App icons in all platforms use the PNG format and support the following color spaces:

sRGB (color)

Gray Gamma 2.2 (grayscale)

In addition, app icons in iOS, iPadOS, macOS, tvOS, and watchOS support Display P3 (wide-gamut color).

The layers, transparency, and corner radius of an app icon can vary per platform. Specifically:

Platform

Layers

Transparency

Asset shape

iOS, iPadOS

Single

No

Square

macOS

Single

Yes, as appropriate

Square with rounded corners

tvOS

Multiple

No

Rectangle

visionOS

Multiple

Yes, as appropriate

Square

watchOS

Single

No

Square

App icon sizes
iOS, iPadOS app icon sizes
For the App Store, create an app icon that measures 1024x1024 px.

You can let the system automatically scale down your 1024x1024 px app icon to produce all other sizes, or — if you want to customize the appearance of the icon at specific sizes — you can supply multiple versions such as the following.

@2x (pixels)

@3x (pixels) iPhone only

Usage

120x120

180x180

Home Screen on iPhone

167x167

–

Home Screen on iPad Pro

152x152

–

Home Screen on iPad, iPad mini

80x80

120x120

Spotlight on iPhone, iPad Pro, iPad, iPad mini

58x58

87x87

Settings on iPhone, iPad Pro, iPad, iPad mini

76x76

114x114

Notifications on iPhone, iPad Pro, iPad, iPad mini

macOS app icon sizes
For the App Store, create an app icon that measures 1024x1024 px.

In addition to the App Store version, you also need to supply your app icon in the following sizes.

@1x (pixels)

@2x (pixels)

512x512

1024x1024

256x256

512x512

128x128

256x256

32x32

64x64

16x16

32x32

