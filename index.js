addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
/**
 * Handles the request for a user
 * @param {Request} request
 */
async function handleRequest(request) {
  try {
    let urlIndex = 0;
    let hasCookie = false;

    //checking if cookie exists
    var cookies = request.headers.get("Cookie");
    if (cookies !== null) {
      cookiesArray = cookies.split(";");
      for (c of cookiesArray) {
        if (c.includes("variant=")) {
          hasCookie = true;
          urlIndex = parseInt(c.charAt(c.indexOf("variant=") + 8));
          console.log(c);
        }
      }
    } else {
      //If no cookie is present, then we want to set the url randomly
      urlIndex = Math.floor(Math.random() * 2);
    }

    let urlJSONArray = await getTwoUrls();
    const randomResponse = await fetchRequest(urlJSONArray[urlIndex]); //fetch the response from a random URL in our array of URLs
    const response = new Response(randomResponse.body, randomResponse); //we create a new response in order to modify the headers to add the cookie

    //attaching cookie in headers ONLY if it wasnt present earlier
    if (!hasCookie) {
      response.headers.append(
        "Set-Cookie",
        "variant=" + urlIndex + "; Max-Age=3600" //Cookie will expire after an hour
      );
    }

    return new HTMLRewriter()
      .on("*", new ElementHandler(urlIndex))
      .transform(response); //This HTMLRewriter will return a response with some of the HTML changed out
  } catch (err) {
    return new Response(err.stack || err);
  }
}

/**
 * Fetch Two URLS from the Cloudflare API
 *
 * returns a promise that resolves into an array
 */
function getTwoUrls() {
  var urlJSONArray;
  return new Promise(function(resolve, reject) {
    fetch("https://cfw-takehome.developers.workers.dev/api/variants").then(
      response => {
        console.log(response.status);

        response.json().then(data => {
          urlJSONArray = data.variants;
          resolve(urlJSONArray);
        });
      }
    );
  });
}
/**
 * Fetches the response object returned by the given url
 * @param {String} url url of the website
 *
 * returns a promise that resolves into a response object
 */
function fetchRequest(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        resolve(response);
      })
      .catch(err => {
        reject(err);
      });
  });
}

/**
 * ElementHandler class for the HTMLRewriter instance
 *
 */
class ElementHandler {
  /**
   * Constructor of an ElementHandler Instance
   * @param {Integer} variantNumber the number of the variant in order to make proper changes based on its value
   */
  constructor(variantNumber) {
    this.variantNumber = variantNumber;
  }
  element(element) {
    if (element.tagName == "title") {
      element.setInnerContent("Daniel's Incredible Worker");
    }
    const elementIdAttribute = element.getAttribute("id");
    if (elementIdAttribute == "description") {
      var text;
      var url;
      if (this.variantNumber == 1) {
        text =
          "Welcome to the casual variant. Please click the link below for the ~full~ experience";
      } else {
        text =
          "Welcome to the business variant. Please click the link below for more information";
      }
      element.setInnerContent(text);
    } else if (elementIdAttribute == "title") {
      if (this.variantNumber == 1) {
        text = "Casual Variant";
      } else {
        text = "Business Variant";
      }
      element.setInnerContent(text);
    } else if (elementIdAttribute == "url") {
      if (this.variantNumber == 1) {
        text = "Continue to youtube";
        url = "https://youtu.be/uO8R42-Lzko"
        element.setAttribute("href", url);
      } else {
        text = "Click here to redirect to www.youtube.com";
        url = "https://youtu.be/CxemIQ3J0zc"
        element.setAttribute("href", url);
      }
      element.setInnerContent(text);
    }
  }
}
