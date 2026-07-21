const BUILD_STAMP_ID = "storybook-build-stamp";

function create_build_stamp() {
  const build_info = globalThis.STORYBOOK_BUILD_INFO;

  if (!build_info || document.getElementById(BUILD_STAMP_ID)) {
    return;
  }

  const build_stamp = document.createElement("div");
  const identity_label = document.createElement("span");
  const version_label = document.createElement("span");
  const version_number = document.createElement("span");
  const version_separator = document.createElement("span");
  const date_separator = document.createElement("span");
  const git_hash_link = document.createElement("a");
  const credit_label = document.createElement("span");
  const date_label = document.createElement("span");

  build_stamp.id = BUILD_STAMP_ID;
  build_stamp.className = "storybook-build-stamp";
  build_stamp.setAttribute("aria-label", "Storybook build information");

  identity_label.className = "storybook-build-stamp__identity";
  version_label.textContent = "Version";
  version_number.textContent = build_info.project_version;
  version_separator.textContent = "·";
  version_separator.setAttribute("aria-hidden", "true");
  date_label.className = "storybook-build-stamp__date";
  date_label.textContent = build_info.created_gmt;
  date_separator.textContent = "·";
  date_separator.setAttribute("aria-hidden", "true");
  git_hash_link.className = "storybook-build-stamp__git-hash";
  git_hash_link.href = build_info.commit_url;
  git_hash_link.target = "_blank";
  git_hash_link.rel = "noopener noreferrer";
  git_hash_link.textContent = build_info.commit_hash;
  identity_label.append(
    version_label,
    version_number,
    version_separator,
    date_label,
    date_separator,
    git_hash_link,
  );
  credit_label.className = "storybook-build-stamp__credit";
  credit_label.textContent = `made by ${build_info.collaboration_credit}`;

  build_stamp.append(identity_label, credit_label);
  document.body.append(build_stamp);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", create_build_stamp, { once: true });
} else {
  create_build_stamp();
}
