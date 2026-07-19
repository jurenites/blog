import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { TOKEN_VALUES } from "../generated/token/tokens.js";

const ROOT_DIRECTORY = resolve(fileURLToPath(new URL("..", import.meta.url)));
const STORYBOOK_DIRECTORY = resolve(ROOT_DIRECTORY, "storybook-static");
const PORT_NUMBER = Number.parseInt(process.env.STORYBOOK_INSPECT_PORT || "7778", 10);
const HOST_ADDRESS = "127.0.0.1";
const STORY_GROUPS = ["Foundations/", "Atoms/", "Molecules/", "Organisms/"];
const CONTENT_TYPES = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function token_pixel_value(token_name) {
  return Number.parseInt(TOKEN_VALUES[token_name], 10);
}

const INSPECTION_VIEWPORTS = [
  {
    viewport_name: "mobile-min",
    viewport_width: token_pixel_value("system-breakpoint-mobile-min"),
    viewport_height: 780,
  },
  {
    viewport_name: "desktop-min",
    viewport_width: token_pixel_value("system-breakpoint-desktop-min"),
    viewport_height: 900,
  },
  {
    viewport_name: "desktop-max",
    viewport_width: token_pixel_value("system-breakpoint-desktop-max"),
    viewport_height: 1080,
  },
];

function content_type(file_path) {
  return CONTENT_TYPES[extname(file_path)] || "application/octet-stream";
}

async function file_exists(file_path) {
  try {
    const file_stat = await stat(file_path);
    return file_stat.isFile();
  } catch {
    return false;
  }
}

async function story_identifiers() {
  const index_path = resolve(STORYBOOK_DIRECTORY, "index.json");
  const index_data = JSON.parse(await readFile(index_path, "utf8"));

  return Object.values(index_data.entries)
    .filter((story_entry) =>
      story_entry.type === "story" &&
      STORY_GROUPS.some((group_name) => story_entry.title.startsWith(group_name)))
    .map((story_entry) => story_entry.id)
    .sort();
}

function create_static_server() {
  return createServer(async (http_request, http_response) => {
    const request_url = new URL(http_request.url, `http://${HOST_ADDRESS}:${PORT_NUMBER}`);
    const relative_path = request_url.pathname === "/"
      ? "index.html"
      : decodeURIComponent(request_url.pathname).replace(/^\/+/, "");
    let file_path = resolve(STORYBOOK_DIRECTORY, relative_path);
    const allowed_prefix = `${STORYBOOK_DIRECTORY}${sep}`;

    if (file_path !== STORYBOOK_DIRECTORY && !file_path.startsWith(allowed_prefix)) {
      http_response.writeHead(403);
      http_response.end("Forbidden");
      return;
    }

    if (!(await file_exists(file_path))) {
      file_path = resolve(STORYBOOK_DIRECTORY, "index.html");
    }

    try {
      const file_body = await readFile(file_path);
      http_response.writeHead(200, { "content-type": content_type(file_path) });
      http_response.end(file_body);
    } catch {
      http_response.writeHead(404);
      http_response.end("Not found");
    }
  });
}

function listen_to_server(server_instance) {
  return new Promise((resolve_listen, reject_listen) => {
    server_instance.once("error", reject_listen);
    server_instance.listen(PORT_NUMBER, HOST_ADDRESS, resolve_listen);
  });
}

async function inspect_story(browser_instance, story_id, viewport_config) {
  const page_instance = await browser_instance.newPage({
    viewport: {
      width: viewport_config.viewport_width,
      height: viewport_config.viewport_height,
    },
  });
  const browser_messages = [];

  page_instance.on("console", (console_message) => {
    if (["error", "warning"].includes(console_message.type())) {
      browser_messages.push(`${console_message.type()}: ${console_message.text()}`);
    }
  });
  page_instance.on("pageerror", (page_error) => {
    browser_messages.push(`pageerror: ${page_error.message}`);
  });

  try {
    await page_instance.goto(
      `http://${HOST_ADDRESS}:${PORT_NUMBER}/iframe.html?id=${story_id}&viewMode=story`,
      { waitUntil: "networkidle" },
    );

    const page_metrics = await page_instance.evaluate(() => {
      const undefined_vars = new Set();
      for (const style_sheet of Array.from(document.styleSheets)) {
        let style_rules = [];
        try {
          style_rules = Array.from(style_sheet.cssRules || []);
        } catch {
          continue;
        }
        for (const style_rule of style_rules) {
          for (const variable_match of String(style_rule.cssText).matchAll(/var\((--[a-z0-9-]+)/g)) {
            const variable_value = getComputedStyle(document.documentElement)
              .getPropertyValue(variable_match[1])
              .trim();
            if (!variable_value) {
              undefined_vars.add(variable_match[1]);
            }
          }
        }
      }

      const body_rect = document.body.getBoundingClientRect();
      const visible_elements = Array.from(document.querySelectorAll("*")).filter((page_element) => {
        const element_rect = page_element.getBoundingClientRect();
        return element_rect.width > 0 && element_rect.height > 0;
      });

      return {
        body_height: Math.round(body_rect.height),
        horizontal_overflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        undefined_vars: Array.from(undefined_vars).sort(),
        visible_element_count: visible_elements.length,
      };
    });

    return {
      browser_messages: Array.from(new Set(browser_messages)),
      page_metrics,
    };
  } finally {
    await page_instance.close();
  }
}

const server_instance = create_static_server();
await listen_to_server(server_instance);

let failed_count = 0;
let browser_instance;

try {
  const story_ids = await story_identifiers();
  browser_instance = await chromium.launch({ headless: true });

  for (const viewport_config of INSPECTION_VIEWPORTS) {
    for (const story_id of story_ids) {
      const inspection_result = await inspect_story(browser_instance, story_id, viewport_config);
      const has_failures =
        inspection_result.browser_messages.length > 0 ||
        inspection_result.page_metrics.undefined_vars.length > 0 ||
        inspection_result.page_metrics.visible_element_count < 3 ||
        inspection_result.page_metrics.body_height < 10 ||
        inspection_result.page_metrics.horizontal_overflow;

      if (has_failures) {
        failed_count += 1;
      }

      console.log(
        `${has_failures ? "FAIL" : "OK"} ${viewport_config.viewport_name} ${story_id}`,
      );
      if (inspection_result.browser_messages.length > 0) {
        console.log(`  messages: ${inspection_result.browser_messages.join(" | ")}`);
      }
      if (inspection_result.page_metrics.undefined_vars.length > 0) {
        console.log(`  missing vars: ${inspection_result.page_metrics.undefined_vars.join(", ")}`);
      }
      if (inspection_result.page_metrics.horizontal_overflow) {
        console.log("  horizontal overflow detected");
      }
    }
  }
} finally {
  if (browser_instance) {
    await browser_instance.close();
  }
  server_instance.close();
}

if (failed_count > 0) {
  process.exit(1);
}
