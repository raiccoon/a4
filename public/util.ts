type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Get Posts by Author Collection",
    endpoint: "/api/posts?authorsIn=[author_collection]",
    method: "GET",
    fields: { author_collection: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Make Post Visible - One Viewer",
    endpoint: "/api/exclusives/posts/:post?viewer=[viewer]",
    method: "POST",
    fields: { viewer: "input", post: "input" },
  },
  {
    name: "Make Post Visible - Collection of Viewers",
    endpoint: "/api/exclusives/posts/:post?viewer_collection=[viewerCollection]",
    method: "POST",
    fields: { viewerCollection: "input", post: "input" },
  },
  {
    name: "Create Post Collection",
    endpoint: "/api/post_collections",
    method: "POST",
    fields: { label: "input" },
  },
  {
    name: "Get Post Collections By User",
    endpoint: "/api/post_collections/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Add To Post Collection",
    endpoint: "/api/post_collections/:collection/posts",
    method: "POST",
    fields: { collection: "input", post: "input", note: "input" },
  },
  {
    name: "Get Posts In Collection",
    endpoint: "/api/post_collections/:collection/posts",
    method: "GET",
    fields: { collection: "input" },
  },
  {
    name: "Get Collections associated with Post",
    endpoint: "/api/post_collections/post/:id",
    method: "GET",
    fields: { post: "input" },
  },
  {
    name: "Make Post Collection Visible - One Viewer",
    endpoint: "/api/exclusives/post_collections/:collection?viewer=[viewer]",
    method: "POST",
    fields: { viewer: "input", collection: "input" },
  },
  {
    name: "Make Post Collection Visible - Collection of Viewers",
    endpoint: "/api/exclusives/post_collections/:collection?viewer_collection=[viewerCollection]",
    method: "POST",
    fields: { viewerCollection: "input", collection: "input" },
  },
  {
    name: "Create User Collection",
    endpoint: "/api/user_collections",
    method: "POST",
    fields: { label: "input" },
  },
  {
    name: "Get User Collections By User",
    endpoint: "/api/user_collections/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Add To User Collection",
    endpoint: "/api/user_collections/:collection/users",
    method: "POST",
    fields: { collection: "input", user: "input", note: "input" },
  },
  {
    name: "Get Users In Collection",
    endpoint: "/api/user_collections/:collection/users",
    method: "GET",
    fields: { collection: "input" },
  },
  {
    name: "Get Collections associated with User",
    endpoint: "/api/user_collections/user/:id",
    method: "GET",
    fields: { user: "input" },
  },
  {
    name: "Make User Collection Visible - One Viewer",
    endpoint: "/api/exclusives/user_collections/:collection?viewer=[viewer]",
    method: "POST",
    fields: { viewer: "input", collection: "input" },
  },
  {
    name: "Make User Collection Visible - Collection of Viewers",
    endpoint: "/api/exclusives/user_collections/:collection?viewer_collection=[viewerCollection]",
    method: "POST",
    fields: { viewerCollection: "input", collection: "input" },
  },
  {
    name: "Get Profile (empty for logged-in user's profile)",
    endpoint: "/api/profiles",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Update Profile Name",
    endpoint: "/api/profiles/:id/name",
    method: "PATCH",
    fields: { id: "input", name: "input" },
  },
  {
    name: "Update Profile Bio",
    endpoint: "/api/profiles/:id/bio",
    method: "PATCH",
    fields: { id: "input", bio: "input" },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
