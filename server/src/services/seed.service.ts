import prisma from "../config/database";
import { hashPassword } from "../utils/password";

interface EmployerSeed {
  fullName: string;
  email: string;
  companyName: string;
  industry: string;
  location: string;
  description: string;
  website: string;
}

interface JobSeed {
  company: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  jobType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE";
}

const EMPLOYERS: EmployerSeed[] = [
  {
    fullName: "Tech Solutions Ltd HR",
    email: "hr@techsolutions-ng.com",
    companyName: "Tech Solutions Ltd",
    industry: "Technology",
    location: "Lagos, Nigeria",
    description: "A leading Nigerian technology firm delivering innovative software and digital solutions.",
    website: "https://techsolutions-ng.com",
  },
  {
    fullName: "PayWave Systems Recruitment",
    email: "jobs@paywavesystems.com",
    companyName: "PayWave Systems",
    industry: "Financial Technology",
    location: "Abuja, Nigeria",
    description: "Africa's next-generation payment infrastructure company.",
    website: "https://paywavesystems.com",
  },
  {
    fullName: "SecureNet Africa HR",
    email: "careers@securenet-africa.com",
    companyName: "SecureNet Africa",
    industry: "Cybersecurity",
    location: "Lagos, Nigeria",
    description: "Premier cybersecurity firm protecting businesses across West Africa.",
    website: "https://securenet-africa.com",
  },
  {
    fullName: "CogniFlow Labs Hiring",
    email: "talent@cogniflowlabs.com",
    companyName: "CogniFlow Labs",
    industry: "Artificial Intelligence",
    location: "Lagos, Nigeria (Remote)",
    description: "Pioneering AI automation and machine learning solutions for African enterprises.",
    website: "https://cogniflowlabs.com",
  },
  {
    fullName: "CloudCore Infrastructure HR",
    email: "jobs@cloudcore.ng",
    companyName: "CloudCore Infrastructure",
    industry: "Cloud Technology",
    location: "Port Harcourt, Nigeria",
    description: "Nigeria's trusted cloud data architecture and infrastructure company.",
    website: "https://cloudcore.ng",
  },
  {
    fullName: "DevCloud Systems Talent",
    email: "careers@devcloud.ng",
    companyName: "DevCloud Systems",
    industry: "DevOps / Cloud Engineering",
    location: "Abuja, Nigeria",
    description: "End-to-end DevOps and cloud infrastructure solutions for scale-ups and enterprises.",
    website: "https://devcloud.ng",
  },
  {
    fullName: "Insight Analytics Africa HR",
    email: "hr@insightanalytics.ng",
    companyName: "Insight Analytics Africa",
    industry: "Data Analytics",
    location: "Lagos, Nigeria",
    description: "Pan-African business intelligence and data analytics consulting firm.",
    website: "https://insightanalytics.ng",
  },
  {
    fullName: "BuildRight Services HR",
    email: "jobs@buildright.ng",
    companyName: "BuildRight Services",
    industry: "Construction & Electrical",
    location: "Port Harcourt, Nigeria",
    description: "Nigeria's leading construction, electrical, and solar installation company.",
    website: "https://buildright.ng",
  },
  {
    fullName: "StyleCraft Atelier HR",
    email: "jobs@stylecraft.ng",
    companyName: "StyleCraft Atelier",
    industry: "Fashion & Textiles",
    location: "Abuja, Nigeria",
    description: "Premium bespoke fashion house and tailoring atelier based in Abuja.",
    website: "https://stylecraft.ng",
  },
  {
    fullName: "AutoCraft Technical Hub HR",
    email: "jobs@autocraft.ng",
    companyName: "AutoCraft Technical Hub",
    industry: "Automotive",
    location: "Benin City, Nigeria",
    description: "Automotive diagnostics, servicing, and technical training hub.",
    website: "https://autocraft.ng",
  },
  {
    fullName: "TechWeld Engineering HR",
    email: "jobs@techweld.ng",
    companyName: "TechWeld Engineering",
    industry: "Welding & Metal Fabrication",
    location: "Aba, Nigeria",
    description: "Industrial welding, structural steel, and metal fabrication specialists.",
    website: "https://techweld.ng",
  },
  {
    fullName: "WoodCraft Designs HR",
    email: "jobs@woodcraft-designs.ng",
    companyName: "WoodCraft Designs",
    industry: "Furniture & Interior Design",
    location: "Lagos, Nigeria",
    description: "Bespoke furniture manufacturing and architectural woodworking firm.",
    website: "https://woodcraft-designs.ng",
  },
  {
    fullName: "PlumbPro Nigeria HR",
    email: "jobs@plumbpro.ng",
    companyName: "PlumbPro Nigeria",
    industry: "Plumbing & Piping",
    location: "Lagos, Nigeria",
    description: "Professional plumbing and water systems installation services.",
    website: "https://plumbpro.ng",
  },
];

const JOBS: JobSeed[] = [
  // ── TECHNOLOGY JOBS ──
  {
    company: "Tech Solutions Ltd",
    title: "Frontend Developer (React & TypeScript)",
    description: "Build and maintain responsive, high-performance web applications using React, TypeScript, and modern styling libraries. Collaborate with product managers, UX designers, and backend engineers to craft engaging user experiences across Nigeria.",
    requirements: "• 1-3 years experience with React and TypeScript\n• Strong understanding of responsive layout, HTML5, and CSS3\n• Experience consuming RESTful APIs\n• Familiarity with Git version control",
    location: "Lagos, Nigeria (Hybrid)",
    salaryMin: 350000,
    salaryMax: 600000,
    jobType: "FULL_TIME",
  },
  {
    company: "PayWave Systems",
    title: "Backend Engineer (Node.js & Python)",
    description: "Architect and maintain secure, highly reliable payment infrastructure and APIs processing financial transactions across Africa.",
    requirements: "• 2+ years backend development with Node.js or Python\n• Relational database schema design and optimization (MySQL/PostgreSQL)\n• Strong knowledge of REST APIs, authentication, and security principles",
    location: "Abuja, Nigeria (Remote)",
    salaryMin: 400000,
    salaryMax: 750000,
    jobType: "FULL_TIME",
  },
  {
    company: "SecureNet Africa",
    title: "Cybersecurity Analyst & Penetration Tester",
    description: "Perform penetration testing, vulnerability assessments, security architecture audits, and threat monitoring for commercial banks and corporate clients.",
    requirements: "• 2+ years ethical hacking and penetration testing experience\n• Proficiency with Burp Suite, Metasploit, Nmap, and Wireshark\n• Deep understanding of OWASP Top 10 and network security\n• Security certifications (CEH, OSCP) preferred",
    location: "Lagos, Nigeria",
    salaryMin: 500000,
    salaryMax: 850000,
    jobType: "FULL_TIME",
  },
  {
    company: "CogniFlow Labs",
    title: "AI & Machine Learning Automation Engineer",
    description: "Build, fine-tune, and deploy machine learning models, natural language processing pipelines, and automated intelligence workflows for enterprise automation.",
    requirements: "• 2+ years working with Python ML frameworks (PyTorch, TensorFlow, scikit-learn)\n• Hands-on experience with LLM APIs, prompt engineering, and RAG pipelines\n• Experience containerizing models with Docker",
    location: "Lagos, Nigeria (Remote)",
    salaryMin: 600000,
    salaryMax: 1100000,
    jobType: "FULL_TIME",
  },
  {
    company: "CloudCore Infrastructure",
    title: "Database Administrator & Cloud Data Architect",
    description: "Design, tune, and maintain scalable cloud database architectures, disaster recovery plans, automated backups, and database security across enterprise client infrastructures.",
    requirements: "• 3+ years experience as a MySQL or PostgreSQL Database Administrator\n• Cloud database experience (AWS RDS, Google Cloud SQL, Azure SQL)\n• Query performance profiling, index tuning, and high availability clustering",
    location: "Port Harcourt, Nigeria",
    salaryMin: 450000,
    salaryMax: 700000,
    jobType: "FULL_TIME",
  },
  {
    company: "DevCloud Systems",
    title: "Cloud Infrastructure & DevOps Engineer",
    description: "Implement continuous integration and delivery pipelines, infrastructure as code, and Kubernetes cluster management on AWS and Azure cloud platforms.",
    requirements: "• 2+ years DevOps or Site Reliability Engineering experience\n• Proficiency with Docker, Kubernetes, and Terraform\n• CI/CD pipeline automation with GitHub Actions or GitLab CI\n• Solid Linux administration skills",
    location: "Abuja, Nigeria (Remote)",
    salaryMin: 550000,
    salaryMax: 900000,
    jobType: "FULL_TIME",
  },
  {
    company: "Insight Analytics Africa",
    title: "Data Analyst & Business Intelligence Specialist",
    description: "Transform business data into actionable visual insights, management dashboards, and predictive reports to guide executive decision-making.",
    requirements: "• 1-3 years experience in data analytics or business intelligence\n• Advanced SQL query writing and data extraction\n• Dashboard creation in Power BI, Tableau, or Looker\n• Proficiency in Python or Excel modeling",
    location: "Lagos, Nigeria",
    salaryMin: 350000,
    salaryMax: 550000,
    jobType: "FULL_TIME",
  },
  {
    company: "Tech Solutions Ltd",
    title: "UI/UX Product Designer",
    description: "Design intuitive user journeys, wireframes, component libraries, and interactive prototypes for cross-platform web and mobile products.",
    requirements: "• 2+ years UI/UX product design experience using Figma\n• Solid portfolio showcasing end-to-end design thinking and usability testing\n• Knowledge of typography, WCAG accessibility, and design systems",
    location: "Lagos, Nigeria (Hybrid)",
    salaryMin: 300000,
    salaryMax: 520000,
    jobType: "FULL_TIME",
  },
  {
    company: "Insight Analytics Africa",
    title: "Digital Marketing & Growth Specialist",
    description: "Drive multi-channel customer acquisition, SEO optimization, social campaigns, and performance marketing funnels to scale user adoption.",
    requirements: "• 2+ years managing paid search, social ads, and content marketing\n• Strong analytics mindset with Google Analytics and conversion tracking\n• SEO technical auditing and keyword optimization skills",
    location: "Lagos, Nigeria (Hybrid)",
    salaryMin: 280000,
    salaryMax: 450000,
    jobType: "FULL_TIME",
  },
  {
    company: "PayWave Systems",
    title: "Junior Finance & Accounts Associate",
    description: "Handle day-to-day transaction reconciliations, financial auditing, vendor billing, and accounting reporting in a fast-paced fintech company.",
    requirements: "• 0-2 years accounting or finance experience\n• Advanced Microsoft Excel skills (vlookup, pivot tables)\n• Working knowledge of accounting software (QuickBooks/Sage)\n• Degree in Accounting, Banking & Finance, or Economics",
    location: "Abuja, Nigeria",
    salaryMin: 180000,
    salaryMax: 300000,
    jobType: "FULL_TIME",
  },

  // ── ARTISAN & SKILLED TRADES JOBS ──
  {
    company: "BuildRight Services",
    title: "Master Electrician & Solar Installation Technician",
    description: "Lead electrical wiring, safety compliance, inverter systems, and solar panel installations for commercial and residential buildings across Port Harcourt.",
    requirements: "• 3+ years experience as a licensed or certified electrician\n• Hands-on expertise in solar PV panels, inverters, and battery banks\n• Electrical code compliance and blueprint interpretation",
    location: "Port Harcourt, Nigeria",
    salaryMin: 180000,
    salaryMax: 320000,
    jobType: "CONTRACT",
  },
  {
    company: "PlumbPro Nigeria",
    title: "Plumbing & Water Systems Installation Specialist",
    description: "Install, repair, and maintain commercial water supply networks, pressure pumps, drainage pipes, and sanitary fixtures across Lagos.",
    requirements: "• 2+ years commercial or residential plumbing experience\n• Proficiency with PPR, PVC, and copper piping systems\n• Water testing, leak repair, and drainage system knowledge",
    location: "Lagos, Nigeria",
    salaryMin: 150000,
    salaryMax: 260000,
    jobType: "CONTRACT",
  },
  {
    company: "StyleCraft Atelier",
    title: "Bespoke Fashion Tailor & Pattern Cutter",
    description: "Design and construct custom couture garments, traditional attires, and bespoke suits for clientele in Abuja.",
    requirements: "• 3+ years professional tailoring and pattern drafting experience\n• High proficiency on industrial sewing and finishing machines\n• Experience working with luxury fabrics (Ankara, Lace, Cashmere, Brocade)",
    location: "Abuja, Nigeria",
    salaryMin: 120000,
    salaryMax: 220000,
    jobType: "FULL_TIME",
  },
  {
    company: "AutoCraft Technical Hub",
    title: "Automotive Diagnostics Technician & Mechanic",
    description: "Diagnose and repair computerized vehicle systems, engine electrical faults, and transmission mechanics using electronic diagnostic equipment.",
    requirements: "• 3+ years automotive diagnostics and mechanical repair experience\n• Proficiency with OBD-II diagnostic scanners and electrical schematics\n• Experience with modern petrol and diesel vehicle engines",
    location: "Benin City, Nigeria",
    salaryMin: 150000,
    salaryMax: 280000,
    jobType: "FULL_TIME",
  },
  {
    company: "WoodCraft Designs",
    title: "Furniture Carpenter & Architectural Woodworker",
    description: "Fabricate bespoke architectural cabinetry, modular kitchens, wooden doors, and luxury home furniture.",
    requirements: "• 3+ years professional carpentry and furniture making experience\n• Expertise in hardwood joinery, cutting tools, and finishing techniques\n• Ability to read and execute custom design specifications",
    location: "Lagos, Nigeria",
    salaryMin: 130000,
    salaryMax: 250000,
    jobType: "FULL_TIME",
  },
  {
    company: "TechWeld Engineering",
    title: "Structural Welder & Metal Fabricator",
    description: "Weld and fabricate structural steel components, industrial gates, tanks, and structural frames according to engineering blueprints.",
    requirements: "• 3+ years certified welding experience (MIG, TIG, ARC)\n• Precision metal cutting, measuring, and fabrication skills\n• Safety certification or technical trade qualification",
    location: "Aba, Abia State, Nigeria",
    salaryMin: 160000,
    salaryMax: 290000,
    jobType: "CONTRACT",
  },
  {
    company: "BuildRight Services",
    title: "Tiling & Flooring Installation Specialist",
    description: "Install ceramic, porcelain, granite, and vinyl floor and wall tiles with high precision, level alignment, and waterproof screeding.",
    requirements: "• 2+ years professional tiling and flooring experience\n• Mastery of tile cutting, spacing, screeding, and epoxy grouting\n• Attention to detail and clean finishing",
    location: "Port Harcourt, Nigeria",
    salaryMin: 120000,
    salaryMax: 210000,
    jobType: "CONTRACT",
  },
  {
    company: "StyleCraft Atelier",
    title: "Embroidery & Fashion Accessories Artisan",
    description: "Hand-craft intricate embroidery, beadwork, appliques, and custom fashion accessories for luxury couture fashion collections.",
    requirements: "• 2+ years hand or machine embroidery experience\n• Creative aesthetic eye for beadwork and garment embellishment\n• Precision and patience for fine hand craftsmanship",
    location: "Abuja, Nigeria",
    salaryMin: 100000,
    salaryMax: 200000,
    jobType: "FULL_TIME",
  },
  {
    company: "PlumbPro Nigeria",
    title: "Refrigeration & Air Conditioning (HVAC) Technician",
    description: "Install, service, and maintain residential and commercial air conditioning and refrigeration systems across Lagos.",
    requirements: "• 2+ years experience in air conditioning and refrigeration repair\n• Safe handling of refrigerants, vacuum testing, and compressor diagnostics\n• Electrical wiring and HVAC maintenance certification",
    location: "Lagos, Nigeria",
    salaryMin: 140000,
    salaryMax: 250000,
    jobType: "FULL_TIME",
  },
];

export async function ensureSeededJobs(): Promise<void> {
  try {
    const existingCount = await prisma.job.count({
      where: {
        title: "Frontend Developer (React & TypeScript)",
      },
    });

    if (existingCount > 0) {
      console.log("✓ Tech jobs already seeded in database.");
      return;
    }

    console.log("🌱 Auto-seeding SkillLoom modern tech and artisan jobs...");

    const defaultPasswordHash = await hashPassword("SkillLoom@2025");
    const companyProfileMap = new Map<string, { userId: string; profileId: string }>();

    for (const emp of EMPLOYERS) {
      let user = await prisma.user.findUnique({
        where: { email: emp.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            fullName: emp.fullName,
            email: emp.email,
            passwordHash: defaultPasswordHash,
            role: "EMPLOYER",
            status: "ACTIVE",
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
      }

      let profile = await prisma.employerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        profile = await prisma.employerProfile.create({
          data: {
            userId: user.id,
            companyName: emp.companyName,
            industry: emp.industry,
            location: emp.location,
            description: emp.description,
            website: emp.website,
            approvalStatus: "APPROVED",
            approvedAt: new Date(),
          },
        });
      } else if (profile.approvalStatus !== "APPROVED") {
        profile = await prisma.employerProfile.update({
          where: { id: profile.id },
          data: {
            approvalStatus: "APPROVED",
            approvedAt: new Date(),
          },
        });
      }

      companyProfileMap.set(emp.companyName, {
        userId: user.id,
        profileId: profile.id,
      });
    }

    let seededCount = 0;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 45);

    for (const job of JOBS) {
      const employerInfo = companyProfileMap.get(job.company);
      if (!employerInfo) continue;

      const existingJob = await prisma.job.findFirst({
        where: {
          title: job.title,
          employerId: employerInfo.profileId,
        },
      });

      if (!existingJob) {
        await prisma.job.create({
          data: {
            employerId: employerInfo.profileId,
            postedById: employerInfo.userId,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            location: job.location,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: "NGN",
            jobType: job.jobType,
            status: "OPEN",
            applicationDeadline: deadline,
          },
        });
        seededCount++;
      }
    }

    console.log(`✓ Auto-seeded ${seededCount} tech and artisan jobs successfully.`);
  } catch (error) {
    console.error("Auto-seed error (non-fatal):", error);
  }
}
