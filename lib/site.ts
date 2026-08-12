export const PORTFOLIO_URL = "https://devure.in";
export const GITHUB_URL = "https://github.com/sachu0dev";
export const TWITTER_URL = "https://x.com/sachu0dev";
export const LINKEDIN_URL = "https://linkedin.com/in/sachu0dev";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://json.devure.in").replace(/\/+$/, "");

export const SCHEMA_AUTHOR = {
  "@type": "Person",
  name: "Sushil Kumar",
  url: PORTFOLIO_URL,
  sameAs: [GITHUB_URL, TWITTER_URL, LINKEDIN_URL],
};
