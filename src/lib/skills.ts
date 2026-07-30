// Curated skill dictionary with aliases. Used by both the ATS scorer and the
// JD matcher so that "JS" on a resume matches "JavaScript" in a job post.

export interface SkillDef {
  name: string;
  aliases: string[];
  category: "language" | "frontend" | "backend" | "data" | "cloud" | "mobile" | "devops" | "qa" | "design" | "pm" | "soft";
}

export const SKILLS: SkillDef[] = [
  // Languages
  { name: "JavaScript", aliases: ["js", "javascript", "ecmascript"], category: "language" },
  { name: "TypeScript", aliases: ["ts", "typescript"], category: "language" },
  { name: "Python", aliases: ["python"], category: "language" },
  { name: "Java", aliases: ["java"], category: "language" },
  { name: "C#", aliases: ["c#", "csharp", ".net", "dotnet"], category: "language" },
  { name: "Go", aliases: ["golang", "go"], category: "language" },
  { name: "Rust", aliases: ["rust"], category: "language" },
  { name: "PHP", aliases: ["php"], category: "language" },
  { name: "Ruby", aliases: ["ruby"], category: "language" },
  { name: "Kotlin", aliases: ["kotlin"], category: "language" },
  { name: "Swift", aliases: ["swift"], category: "language" },
  { name: "C++", aliases: ["c++", "cpp"], category: "language" },
  { name: "SQL", aliases: ["sql"], category: "language" },
  { name: "Dart", aliases: ["dart"], category: "language" },
  { name: "Scala", aliases: ["scala"], category: "language" },
  { name: "Elixir", aliases: ["elixir"], category: "language" },

  // Frontend
  { name: "React", aliases: ["react", "reactjs", "react.js"], category: "frontend" },
  { name: "Next.js", aliases: ["next.js", "nextjs", "next js"], category: "frontend" },
  { name: "Vue", aliases: ["vue", "vuejs", "vue.js", "nuxt"], category: "frontend" },
  { name: "Angular", aliases: ["angular", "angularjs"], category: "frontend" },
  { name: "Svelte", aliases: ["svelte", "sveltekit"], category: "frontend" },
  { name: "Tailwind CSS", aliases: ["tailwind", "tailwindcss"], category: "frontend" },
  { name: "HTML", aliases: ["html", "html5"], category: "frontend" },
  { name: "CSS", aliases: ["css", "css3", "sass", "scss", "less"], category: "frontend" },
  { name: "Redux", aliases: ["redux"], category: "frontend" },
  { name: "Webpack", aliases: ["webpack", "vite", "rollup", "esbuild"], category: "frontend" },

  // Backend
  { name: "Node.js", aliases: ["node", "nodejs", "node.js"], category: "backend" },
  { name: "Express", aliases: ["express", "expressjs"], category: "backend" },
  { name: "NestJS", aliases: ["nest", "nestjs"], category: "backend" },
  { name: "Django", aliases: ["django"], category: "backend" },
  { name: "Flask", aliases: ["flask"], category: "backend" },
  { name: "FastAPI", aliases: ["fastapi"], category: "backend" },
  { name: "Spring Boot", aliases: ["spring", "spring boot", "springboot"], category: "backend" },
  { name: "Laravel", aliases: ["laravel"], category: "backend" },
  { name: "Rails", aliases: ["rails", "ruby on rails"], category: "backend" },
  { name: "GraphQL", aliases: ["graphql", "apollo"], category: "backend" },
  { name: "REST APIs", aliases: ["rest", "restful", "rest api", "rest apis"], category: "backend" },
  { name: "gRPC", aliases: ["grpc"], category: "backend" },
  { name: "Microservices", aliases: ["microservices", "microservice"], category: "backend" },
  { name: "WebSockets", aliases: ["websocket", "websockets", "socket.io"], category: "backend" },

  // Data
  { name: "PostgreSQL", aliases: ["postgres", "postgresql"], category: "data" },
  { name: "MySQL", aliases: ["mysql", "mariadb"], category: "data" },
  { name: "MongoDB", aliases: ["mongo", "mongodb"], category: "data" },
  { name: "Redis", aliases: ["redis"], category: "data" },
  { name: "Elasticsearch", aliases: ["elasticsearch", "elastic", "opensearch"], category: "data" },
  { name: "Kafka", aliases: ["kafka"], category: "data" },
  { name: "RabbitMQ", aliases: ["rabbitmq", "amqp"], category: "data" },
  { name: "Spark", aliases: ["spark", "pyspark"], category: "data" },
  { name: "Airflow", aliases: ["airflow"], category: "data" },
  { name: "dbt", aliases: ["dbt"], category: "data" },
  { name: "Snowflake", aliases: ["snowflake"], category: "data" },
  { name: "BigQuery", aliases: ["bigquery"], category: "data" },
  { name: "Pandas", aliases: ["pandas", "numpy"], category: "data" },
  { name: "Machine Learning", aliases: ["machine learning", "ml", "scikit-learn", "sklearn"], category: "data" },
  { name: "Deep Learning", aliases: ["deep learning", "pytorch", "tensorflow", "keras"], category: "data" },
  { name: "Data Analysis", aliases: ["data analysis", "data analytics", "tableau", "power bi", "powerbi", "looker"], category: "data" },
  { name: "ETL", aliases: ["etl", "elt", "data pipeline", "data pipelines"], category: "data" },

  // Cloud
  { name: "AWS", aliases: ["aws", "amazon web services", "ec2", "s3", "lambda", "dynamodb", "rds"], category: "cloud" },
  { name: "Azure", aliases: ["azure"], category: "cloud" },
  { name: "GCP", aliases: ["gcp", "google cloud"], category: "cloud" },
  { name: "Serverless", aliases: ["serverless"], category: "cloud" },
  { name: "Supabase", aliases: ["supabase"], category: "cloud" },
  { name: "Firebase", aliases: ["firebase"], category: "cloud" },
  { name: "Vercel", aliases: ["vercel"], category: "cloud" },

  // DevOps
  { name: "Docker", aliases: ["docker", "containers", "containerization"], category: "devops" },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s", "helm"], category: "devops" },
  { name: "CI/CD", aliases: ["ci/cd", "cicd", "continuous integration", "continuous delivery", "github actions", "gitlab ci", "jenkins", "circleci"], category: "devops" },
  { name: "Terraform", aliases: ["terraform", "iac", "infrastructure as code", "pulumi"], category: "devops" },
  { name: "Linux", aliases: ["linux", "unix", "bash", "shell scripting"], category: "devops" },
  { name: "Git", aliases: ["git", "github", "gitlab", "bitbucket"], category: "devops" },
  { name: "Monitoring", aliases: ["monitoring", "observability", "grafana", "prometheus", "datadog", "sentry", "new relic"], category: "devops" },
  { name: "Nginx", aliases: ["nginx", "apache", "load balancing"], category: "devops" },

  // Mobile
  { name: "React Native", aliases: ["react native"], category: "mobile" },
  { name: "Flutter", aliases: ["flutter"], category: "mobile" },
  { name: "iOS", aliases: ["ios", "swiftui", "uikit"], category: "mobile" },
  { name: "Android", aliases: ["android", "jetpack compose"], category: "mobile" },

  // QA
  { name: "Testing", aliases: ["unit testing", "unit tests", "tdd", "jest", "vitest", "pytest", "junit", "mocha"], category: "qa" },
  { name: "E2E Testing", aliases: ["e2e", "end-to-end", "cypress", "playwright", "selenium"], category: "qa" },
  { name: "QA Automation", aliases: ["qa automation", "test automation"], category: "qa" },

  // Design / PM
  { name: "Figma", aliases: ["figma", "sketch", "adobe xd"], category: "design" },
  { name: "UI/UX", aliases: ["ui/ux", "ux", "ui design", "user experience", "user research", "wireframing", "prototyping"], category: "design" },
  { name: "Agile", aliases: ["agile", "scrum", "kanban", "sprint"], category: "pm" },
  { name: "Jira", aliases: ["jira", "confluence", "linear", "asana"], category: "pm" },
  { name: "Product Management", aliases: ["product management", "roadmap", "product strategy", "stakeholder management"], category: "pm" },

  // Soft / domain
  { name: "Leadership", aliases: ["leadership", "team lead", "mentoring", "mentorship", "coaching"], category: "soft" },
  { name: "Communication", aliases: ["communication", "presentation", "cross-functional"], category: "soft" },
  { name: "Problem Solving", aliases: ["problem solving", "problem-solving", "analytical"], category: "soft" },
  { name: "English", aliases: ["english", "fluent english"], category: "soft" },
  { name: "Thai", aliases: ["thai language", "thai speaker"], category: "soft" },
  { name: "Mandarin", aliases: ["mandarin", "chinese"], category: "soft" },
  { name: "Bahasa Malaysia", aliases: ["bahasa", "malay"], category: "soft" },
  { name: "Security", aliases: ["security", "owasp", "penetration testing", "appsec", "cybersecurity"], category: "soft" },
  { name: "Blockchain", aliases: ["blockchain", "web3", "solidity", "smart contracts"], category: "soft" },
  { name: "Fintech", aliases: ["fintech", "payments", "banking"], category: "soft" },
  { name: "E-commerce", aliases: ["e-commerce", "ecommerce", "marketplace"], category: "soft" },
];

/** Escape regex special chars in an alias. */
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALIAS_PATTERNS: { skill: SkillDef; re: RegExp }[] = SKILLS.flatMap((skill) =>
  skill.aliases.map((alias) => ({
    skill,
    re: new RegExp(`(^|[^a-z0-9+#.])${esc(alias)}($|[^a-z0-9+#])`, "i"),
  }))
);

/** Find all known skills mentioned in a block of text. */
export function extractSkills(text: string): SkillDef[] {
  const lower = text.toLowerCase();
  const found = new Map<string, SkillDef>();
  for (const { skill, re } of ALIAS_PATTERNS) {
    if (found.has(skill.name)) continue;
    if (re.test(lower)) found.set(skill.name, skill);
  }
  return [...found.values()];
}
