const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

//MS Specific
const axios = require("axios").default;
const async = require("async");
const fs = require("fs");
const https = require("https");
const path = require("path");
const createReadStream = require("fs").createReadStream;
const sleep = require("util").promisify(setTimeout);
const ComputerVisionClient =
  require("@azure/cognitiveservices-computervision").ComputerVisionClient;
const ApiKeyCredentials = require("@azure/ms-rest-js").ApiKeyCredentials;

require("dotenv").config({ path: "./config/.env" });

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const key = process.env.MS_COMPUTER_VISION_SUBSCRIPTION_KEY;
const endpoint = process.env.MS_COMPUTER_VISION_ENDPOINT;
const faceEndpoint = process.env.MS_FACE_ENDPOINT;
const subscriptionKey = process.env.MS_FACE_SUB_KEY;

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
  endpoint
);

//Server Setup
app.set("view engine", "ejs");
app.use(express.static("public"));

//Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/", upload.single("file-to-upload"), async (req, res) => {
  try {
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const brandURLImage = result.secure_url;
    async.series([
      async function () {
        // </snippet_functiondef_begin>
  
        /**
         * DESCRIBE IMAGE
         * Describes what the main objects or themes are in an image.
         * Describes both a URL and a local image.
         */
        // console.log('-------------------------------------------------');
        // console.log('DESCRIBE IMAGE');
        // console.log();
  
        // // <snippet_describe_image>
        // const describeURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/celebrities.jpg';
        // // </snippet_describe_image>
  
        // // const describeImagePath = __dirname + '\\celebrities.jpeg';
        // // try {
        // //   await downloadFilesToLocal(describeURL, describeImagePath);
        // // } catch {
        // //   console.log('>>> Download sample file failed. Sample cannot continue');
        // //   process.exit(1);
        // // }
  
        // // <snippet_describe>
        // // Analyze URL image
        // console.log('Analyzing URL image to describe...', describeURL.split('/').pop());
        // const caption = (await computerVisionClient.describeImage(describeURL)).captions[0];
        // console.log(`This may be ${caption.text} (${caption.confidence.toFixed(2)} confidence)`);
        // // </snippet_describe>
  
        // // Analyze local image
        // console.log('\nAnalyzing local image to describe...', path.basename(describeImagePath));
        // // DescribeImageInStream takes a function that returns a ReadableStream, NOT just a ReadableStream instance.
        // const captionLocal = (await computerVisionClient.describeImageInStream(
        //   () => createReadStream(describeImagePath))).captions[0];
        // console.log(`This may be ${caption.text} (${captionLocal.confidence.toFixed(2)} confidence)`);
        // /**
        //  * END - Describe Image
        //  */
        // console.log();
  
        /**
         * DETECT FACES
         * This example detects faces and returns its:
         *     gender, age, location of face (bounding box), confidence score, and size of face.
         */
        console.log('-------------------------------------------------');
        console.log('DETECT FACES');
        console.log();
  
        // <snippet_faces>
        const facesImageURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/faces.jpg';
  
        // Analyze URL image.
        console.log('Analyzing faces in image...', facesImageURL.split('/').pop());
        // Get the visual feature for 'Faces' only.
        const faces = (await computerVisionClient.analyzeImage(facesImageURL, { visualFeatures: ['Faces'] })).faces;
  
        // Print the bounding box, gender, and age from the faces.
        if (faces.length) {
          console.log(`${faces.length} face${faces.length == 1 ? '' : 's'} found:`);
          for (const face of faces) {
            console.log(`    Gender: ${face.gender}`.padEnd(20)
              + ` Age: ${face.age}`.padEnd(10) + `at ${formatRectFaces(face.faceRectangle)}`);
          }
        } else { console.log('No faces found.'); }
        // </snippet_faces>
  
        // <snippet_formatfaces>
        // Formats the bounding box
        function formatRectFaces(rect) {
          return `top=${rect.top}`.padEnd(10) + `left=${rect.left}`.padEnd(10) + `bottom=${rect.top + rect.height}`.padEnd(12)
            + `right=${rect.left + rect.width}`.padEnd(10) + `(${rect.width}x${rect.height})`;
        }
        // </snippet_formatfaces>
  
        /**
         * END - Detect Faces
         */
        console.log();
  
        /**
         * DETECT OBJECTS
         * Detects objects in URL image:
         *     gives confidence score, shows location of object in image (bounding box), and object size. 
         */
        console.log('-------------------------------------------------');
        console.log('DETECT OBJECTS');
        console.log();
  
        // <snippet_objects>
        // Image of a dog
        const objectURL = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-node-sdk-samples/master/Data/image.jpg';
  
        // Analyze a URL image
        console.log('Analyzing objects in image...', objectURL.split('/').pop());
        const objects = (await computerVisionClient.analyzeImage(objectURL, { visualFeatures: ['Objects'] })).objects;
        console.log();
  
        // Print objects bounding box and confidence
        if (objects.length) {
          console.log(`${objects.length} object${objects.length == 1 ? '' : 's'} found:`);
          for (const obj of objects) { console.log(`    ${obj.object} (${obj.confidence.toFixed(2)}) at ${formatRectObjects(obj.rectangle)}`); }
        } else { console.log('No objects found.'); }
        // </snippet_objects>
  
        // <snippet_objectformat>
        // Formats the bounding box
        function formatRectObjects(rect) {
          return `top=${rect.y}`.padEnd(10) + `left=${rect.x}`.padEnd(10) + `bottom=${rect.y + rect.h}`.padEnd(12)
            + `right=${rect.x + rect.w}`.padEnd(10) + `(${rect.w}x${rect.h})`;
        }
        // </snippet_objectformat>
        /**
         * END - Detect Objects
         */
        console.log();
  
        /**
         * DETECT TAGS  
         * Detects tags for an image, which returns:
         *     all objects in image and confidence score.
         */
        // <snippet_tags>
        console.log('-------------------------------------------------');
        console.log('DETECT TAGS');
        console.log();
  
        // Image of different kind of dog.
        const tagsURL = 'https://moderatorsampleimages.blob.core.windows.net/samples/sample16.png';
  
        // Analyze URL image
        console.log('Analyzing tags in image...', tagsURL.split('/').pop());
        const tags = (await computerVisionClient.analyzeImage(tagsURL, { visualFeatures: ['Tags'] })).tags;
        console.log(`Tags: ${formatTags(tags)}`);
        // </snippet_tags>
  
        // <snippet_tagsformat>
        // Format tags for display
        function formatTags(tags) {
          return tags.map(tag => (`${tag.name} (${tag.confidence.toFixed(2)})`)).join(', ');
        }
        // </snippet_tagsformat>
        /**
         * END - Detect Tags
         */
        console.log();
  
        /**
         * DETECT TYPE
         * Detects the type of image, says whether it is clip art, a line drawing, or photograph).
         */
        console.log('-------------------------------------------------');
        console.log('DETECT TYPE');
        console.log();
  
        // <snippet_imagetype>
        const typeURLImage = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-python-sdk-samples/master/samples/vision/images/make_things_happen.jpg';
  
        // Analyze URL image
        console.log('Analyzing type in image...', typeURLImage.split('/').pop());
        const types = (await computerVisionClient.analyzeImage(typeURLImage, { visualFeatures: ['ImageType'] })).imageType;
        console.log(`Image appears to be ${describeType(types)}`);
        // </snippet_imagetype>
  
        // <snippet_imagetype_describe>
        function describeType(imageType) {
          if (imageType.clipArtType && imageType.clipArtType > imageType.lineDrawingType) return 'clip art';
          if (imageType.lineDrawingType && imageType.clipArtType < imageType.lineDrawingType) return 'a line drawing';
          return 'a photograph';
        }
        // </snippet_imagetype_describe>
        /**
         * END - Detect Type
         */
        console.log();
  
        /**
         * DETECT CATEGORY
         * Detects the categories of an image. Two different images are used to show the scope of the features.
         */
        console.log('-------------------------------------------------');
        console.log('DETECT CATEGORY');
        console.log();
  
        // <snippet_categories>
        const categoryURLImage = 'https://moderatorsampleimages.blob.core.windows.net/samples/sample16.png';
  
        // Analyze URL image
        console.log('Analyzing category in image...', categoryURLImage.split('/').pop());
        const categories = (await computerVisionClient.analyzeImage(categoryURLImage)).categories;
        console.log(`Categories: ${formatCategories(categories)}`);
        // </snippet_categories>
  
        // <snippet_categories_format>
        // Formats the image categories
        function formatCategories(categories) {
          categories.sort((a, b) => b.score - a.score);
          return categories.map(cat => `${cat.name} (${cat.score.toFixed(2)})`).join(', ');
        }
        // </snippet_categories_format>
        /**
         * END - Detect Categories
         */
        console.log();
  
        /**
         * DETECT BRAND
         * Detects brands and logos that appear in an image.
         */
        console.log('-------------------------------------------------');
        console.log('DETECT BRAND');
        console.log();
  
        // <snippet_brands>
        const brandURLImage = 'https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/images/red-shirt-logo.jpg';
  
        // Analyze URL image
        console.log('Analyzing brands in image...', brandURLImage.split('/').pop());
        const brands = (await computerVisionClient.analyzeImage(brandURLImage, { visualFeatures: ['Brands'] })).brands;
  
        // Print the brands found
        if (brands.length) {
          console.log(`${brands.length} brand${brands.length != 1 ? 's' : ''} found:`);
          for (const brand of brands) {
            console.log(`    ${brand.name} (${brand.confidence.toFixed(2)} confidence)`);
          }
        } else { console.log(`No brands found.`); }
        // </snippet_brands>
        console.log();
  
        /**
         * DETECT COLOR SCHEME
         * Detects the color scheme of an image, including foreground, background, dominant, and accent colors.  
         */
        console.log('-------------------------------------------------');
        console.log('DETECT COLOR SCHEME');
        console.log();
  
        // <snippet_colors>
        const colorURLImage = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/celebrities.jpg';
  
        // Analyze URL image
        console.log('Analyzing image for color scheme...', colorURLImage.split('/').pop());
        console.log();
        const color = (await computerVisionClient.analyzeImage(colorURLImage, { visualFeatures: ['Color'] })).color;
        printColorScheme(color);
        // </snippet_colors>
  
        // <snippet_colors_print>
        // Print a detected color scheme
        function printColorScheme(colors) {
          console.log(`Image is in ${colors.isBwImg ? 'black and white' : 'color'}`);
          console.log(`Dominant colors: ${colors.dominantColors.join(', ')}`);
          console.log(`Dominant foreground color: ${colors.dominantColorForeground}`);
          console.log(`Dominant background color: ${colors.dominantColorBackground}`);
          console.log(`Suggested accent color: #${colors.accentColor}`);
        }
        // </snippet_colors_print>
        /**
         * END - Detect Color Scheme
         */
        console.log();
  
        /**
         * GENERATE THUMBNAIL
         * This example generates a thumbnail image of a specified size, from a URL and a local image.
         */
        console.log('-------------------------------------------------');
        console.log('GENERATE THUMBNAIL');
        console.log();
        // Image of a dog.
        const dogURL = 'https://moderatorsampleimages.blob.core.windows.net/samples/sample16.png';
        console.log('Generating thumbnail...')
        await computerVisionClient.generateThumbnail(100, 100, dogURL, { smartCropping: true })
          .then((thumbResponse) => {
            const destination = fs.createWriteStream("thumb.png")
            thumbResponse.readableStreamBody.pipe(destination)
            console.log('Thumbnail saved.') // Saves into root folder
          })
        console.log();
        /**
         * END - Generate Thumbnail
         */
  
        /**
        * DETECT DOMAIN-SPECIFIC CONTENT
        * Detects landmarks or celebrities.
        */
        console.log('-------------------------------------------------');
        console.log('DETECT DOMAIN-SPECIFIC CONTENT');
        console.log();
  
        // <snippet_domain_image>
        const domainURLImage = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/landmark.jpg';
        // </snippet_domain_image>
  
        // <snippet_landmarks>
        // Analyze URL image
        console.log('Analyzing image for landmarks...', domainURLImage.split('/').pop());
        const domain = (await computerVisionClient.analyzeImageByDomain('landmarks', domainURLImage)).result.landmarks;
  
        // Prints domain-specific, recognized objects
        if (domain.length) {
          console.log(`${domain.length} ${domain.length == 1 ? 'landmark' : 'landmarks'} found:`);
          for (const obj of domain) {
            console.log(`    ${obj.name}`.padEnd(20) + `(${obj.confidence.toFixed(2)} confidence)`.padEnd(20) + `${formatRectDomain(obj.faceRectangle)}`);
          }
        } else {
          console.log('No landmarks found.');
        }
        // </snippet_landmarks>
  
        // <snippet_landmarks_rect>
        // Formats bounding box
        function formatRectDomain(rect) {
          if (!rect) return '';
          return `top=${rect.top}`.padEnd(10) + `left=${rect.left}`.padEnd(10) + `bottom=${rect.top + rect.height}`.padEnd(12) +
            `right=${rect.left + rect.width}`.padEnd(10) + `(${rect.width}x${rect.height})`;
        }
        // </snippet_landmarks_rect>
  
        console.log();
  
        /**
        * DETECT ADULT CONTENT
        * Detects "adult" or "racy" content that may be found in images. 
        * The score closer to 1.0 indicates racy/adult content.
        * Detection for both local and URL images.
        */
        console.log('-------------------------------------------------');
        console.log('DETECT ADULT CONTENT');
        console.log();
  
        // <snippet_adult_image>
        // The URL image and local images are not racy/adult. 
        // Try your own racy/adult images for a more effective result.
        const adultURLImage = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/celebrities.jpg';
        // </snippet_adult_image>
  
        // <snippet_adult>
        // Function to confirm racy or not
        const isIt = flag => flag ? 'is' : "isn't";
  
        // Analyze URL image
        console.log('Analyzing image for racy/adult content...', adultURLImage.split('/').pop());
        const adult = (await computerVisionClient.analyzeImage(adultURLImage, {
          visualFeatures: ['Adult']
        })).adult;
        console.log(`This probably ${isIt(adult.isAdultContent)} adult content (${adult.adultScore.toFixed(4)} score)`);
        console.log(`This probably ${isIt(adult.isRacyContent)} racy content (${adult.racyScore.toFixed(4)} score)`);
        // </snippet_adult>
        console.log();
        /**
        * END - Detect Adult Content
        */
  
        console.log();
        console.log('-------------------------------------------------');
        console.log('End of quickstart.');
        // <snippet_functiondef_end>
  
      },
      function () {
        return new Promise((resolve) => {
          resolve();
        })
      }
    ], (err) => {
      throw (err);
    });
    res.render("result.ejs", { brands: brands, img: brandURLImage });
  } catch (err) {
    console.log(err);
  }
});

app.listen(process.env.PORT || 8000);
