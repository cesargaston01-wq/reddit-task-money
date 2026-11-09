export const BLOG_SITE_URL = "https://reddit-task-money.lovable.app";

export type BlogSection = { id: string; title: string; paragraphs: string[]; bullets?: string[] };
export type BlogArticle = {
  slug: string; title: string; description: string; category: string;
  publishedAt: string; readMinutes: number; summary: string; sections: BlogSection[];
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "get-paid-for-reddit-comments",
    title: "Can you get paid for Reddit comments?",
    description: "Learn how paid Reddit comment missions work on TaskReddit, what approval means, and why account quality and community rules matter.",
    category: "Getting started", publishedAt: "2026-11-09", readMinutes: 5,
    summary: "Yes. TaskReddit offers paid comment missions to approved Reddit account holders. The standard reward is $3.50 per approved comment—not per comment you publish anywhere on Reddit.",
    sections: [
      { id: "what-paid-comments-mean", title: "What does getting paid for a Reddit comment mean?", paragraphs: [
        "A paid comment mission is a specific contribution with a stated reward and a review process. On TaskReddit, the team publishes missions, eligible members reserve one, and the member submits the Reddit link after completing it. An administrator then reviews the contribution.",
        "This is different from receiving money automatically for ordinary Reddit activity. TaskReddit is an independent platform, not Reddit's own rewards program, and it does not pay for every comment on your account. Only an eligible, completed and approved mission creates a mission reward.",
      ] },
      { id: "who-can-join", title: "Who can apply for paid comment missions?", paragraphs: [
        "TaskReddit manually reviews your Reddit profile. The published requirements are an account at least three months old, at least 100 combined post or comment karma, and a natural activity history without spam or bans. Meeting the numerical thresholds does not guarantee approval: overall account quality matters too.",
        "Use your own existing account. Do not buy an account, invent a history, or manipulate karma to qualify. A profile with genuine participation is more relevant than an account created solely to complete paid tasks.",
      ] },
      { id: "mission-process", title: "How a TaskReddit comment mission works", paragraphs: [
        "Start by creating a TaskReddit account and confirming your email. Your Reddit profile must then be accepted before you can take a mission. You can browse the public mission page before being accepted, but browsing is not a reservation.",
        "The comment text may be visible before you reserve. The Reddit destination link and the full brief are available only after you hold the mission. Always reserve before doing the work: another member may already have claimed the available slot.",
      ], bullets: [
        "Check the mission and its displayed reward.",
        "Reserve it with Take this mission. The reservation lasts 10 minutes.",
        "Read the unlocked brief and check the community's rules before publishing.",
        "Submit the link to your actual Reddit comment while the reservation is active.",
        "Wait for the team's review. Approved work is paid through the Talentir payment process.",
      ] },
      { id: "realistic-earnings", title: "How much can you realistically earn?", paragraphs: [
        "TaskReddit's standard comment reward is $3.50 after approval. Always use the amount shown on the particular mission rather than assuming every opportunity has the same price. Publishing a comment alone does not guarantee that the submission will be approved.",
        "Mission availability varies, and each mission has one completion slot. This is an occasional earning opportunity, not a salary or a guaranteed daily income. A reservation can expire, a mission can be taken by someone else, and a removed comment can be refused. Do not convert a per-comment reward into an hourly income promise.",
      ] },
      { id: "community-rules", title: "Paid participation still has to respect Reddit communities", paragraphs: [
        "Payment does not give permission to ignore a subreddit's rules. Check whether the community allows the contribution, follow applicable disclosure requirements for sponsored content, and never present an invented personal experience as your own. If the brief conflicts with a community rule, do not publish it.",
        "Remain genuinely active between tasks, because an account used only for repetitive promotional comments can be removed or banned. Natural activity is not a guarantee against moderation, and it must not be used to conceal sponsorship. Do not buy votes, coordinate votes or try to evade moderation.",
      ] },
      { id: "next-step", title: "Your next step", paragraphs: [
        "Check the available comment missions and read the account requirements before signing up. If your profile is accepted, reserve a mission first and only complete work you can contribute appropriately. For the payment steps, read our Talentir guide below.",
      ] },
    ],
  },
  {
    slug: "taskreddit-account-requirements",
    title: "TaskReddit account requirements: age, karma and review",
    description: "Check the Reddit account age, karma and quality requirements for TaskReddit, and understand email confirmation versus account approval.",
    category: "Account quality", publishedAt: "2026-11-09", readMinutes: 4,
    summary: "To access missions, your Reddit account needs to be at least three months old, have 100 or more combined karma, and pass a manual quality review.",
    sections: [
      { id: "requirements", title: "The three requirements to check first", paragraphs: [
        "TaskReddit reviews the Reddit profile you provide during registration. The age and karma thresholds are starting requirements, not an automatic approval formula. The team also considers whether the account shows genuine participation and is in good standing.",
      ], bullets: [
        "Account age: at least three months.",
        "Karma: at least 100 combined post or comment karma.",
        "Account quality: a natural history, without spam or bans.",
      ] },
      { id: "age-and-karma", title: "Why age and karma are not enough on their own", paragraphs: [
        "A Reddit account's age shows when it was created, not how thoughtfully it has been used. Karma is also not a guarantee of expertise, permission to promote, or acceptance into every subreddit. An older account with enough karma can still fail the quality review.",
        "Look at your existing participation honestly. Relevant conversations, meaningful replies and a consistent history are more useful than attempts to rapidly accumulate votes. Do not use karma exchanges, purchased accounts or coordinated voting to meet the thresholds.",
      ] },
      { id: "email-vs-approval", title: "Email confirmation and profile approval are separate", paragraphs: [
        "Confirming your email establishes that you can receive messages at your registered address. It does not mean your Reddit profile has been approved for missions. After email confirmation, the team still reviews the profile linked to your TaskReddit account.",
        "A pending account is awaiting review. An accepted account can take available missions. A rejected account does not have mission access; check the reason shown in your dashboard. Repeatedly confirming your email does not change the result of a Reddit profile review.",
      ] },
      { id: "apply", title: "How to apply with the right profile", paragraphs: [
        "Create an account with an email address you can access and provide your Reddit profile URL or username. Check that it points to your own profile and not a subreddit or individual post. Confirm the email and wait for the manual review result.",
        "The site states a review target of within 48 hours. Treat this as a target rather than a promise of instant acceptance. There is no need to publish a mission in advance to prove that you can do it: you must have an accepted account and an active reservation first.",
      ] },
      { id: "after-acceptance", title: "Keep your account in good standing after acceptance", paragraphs: [
        "Acceptance does not override subreddit rules or prevent Reddit from moderating your account. Keep participating naturally in topics you understand, do not post the same promotional language repeatedly, and respect rules about sponsored contributions and disclosure.",
        "Before reserving a mission, consider whether you can contribute appropriately in that community. If you cannot comply with the brief and the community's rules, leave the mission for someone else. Preserving a genuine account matters more than chasing a single reward.",
      ] },
      { id: "wallet", title: "Do you need to add a crypto wallet to qualify?", paragraphs: [
        "No. A wallet in your TaskReddit profile is optional, and it is not required to reserve or submit a mission. TaskReddit uses Talentir payment emails for approved payouts. Follow the instructions in the genuine payment email when your payout is ready.",
        "Once accepted, browse the available missions and reserve before publishing. Read the paid-comment guide for the complete workflow and the payment guide for what happens after submission.",
      ] },
    ],
  },
  {
    slug: "taskreddit-payments-talentir",
    title: "How TaskReddit payments work with Talentir",
    description: "Understand TaskReddit submission review, Talentir payment emails, optional wallets, and what to check when a comment or payment is pending.",
    category: "Payments", publishedAt: "2026-11-09", readMinutes: 4,
    summary: "TaskReddit reviews your mission first. The team then manually prepares and approves the payment through Talentir, which emails you a link to claim it.",
    sections: [
      { id: "review-first", title: "Submitting your link is not the same as getting paid", paragraphs: [
        "When you submit the Reddit link for a reserved mission, the contribution enters review. The team checks that the comment exists, meets the brief and has stayed online for at least three hours. That minimum visibility window is not a promise that payment will arrive exactly three hours after submission.",
        "A pending submission is still awaiting a decision. Approval confirms that the work has passed review. Payment is a separate step performed by the team, so an approved submission and a completed payout are not interchangeable statuses.",
      ] },
      { id: "talentir-process", title: "What happens after your mission is approved?", paragraphs: [
        "The administrator checks each approved submission and creates an individual payout. The payment is approved on Talentir's hosted approval screen. The team then sends the payment claim link through Talentir to the member's registered email address.",
        "Open the genuine Talentir email and follow the claim instructions. The methods offered, any identity checks, fees and processing time depend on the options Talentir makes available to you. Do not assume a particular method or instant settlement is available before checking the actual payment screen.",
      ], bullets: [
        "Your reserved mission is submitted with a Reddit comment link.",
        "TaskReddit reviews the contribution and approves eligible work.",
        "The team manually creates and approves the individual Talentir payout.",
        "Talentir sends the payment email; you follow its claim instructions.",
      ] },
      { id: "amount", title: "What amount should you expect?", paragraphs: [
        "The standard TaskReddit comment reward is $3.50 for an approved contribution. The amount displayed on the mission is the reference for that particular submission. It is not a guaranteed daily income or a payment for unrelated comments.",
        "A mission reward does not establish the amount you will receive after a provider's currency conversion or any applicable charges. Review the details shown by Talentir before confirming a payout method. This guide does not promise provider fees, country coverage or transfer times.",
      ] },
      { id: "refused", title: "Why can a comment submission be refused?", paragraphs: [
        "A comment that is not visible or has been removed by Reddit cannot satisfy the mission's visibility requirement. A comment looking normal when viewed from your own account is not, by itself, proof that other people can see it. The team checks the submitted contribution during review.",
        "Check your dashboard for the submission result. TaskReddit sends a rejection email when a submission is refused, explaining that the comment is not visible or has been removed. Do not repost repeatedly, use a second account to evade removal, or assume that an unreserved contribution will be paid.",
      ] },
      { id: "missing-email", title: "What to check if the payment email has not arrived", paragraphs: [
        "First check whether the submission is still pending or has been approved. Approval can come before the team has manually completed the payment steps. Check the email address on your profile, search your inbox for Talentir and look in your spam folder.",
        "If the dashboard indicates payment but you cannot find the email, contact the team at contact@taskreddit.com with the relevant mission information. Never send your password, wallet recovery phrase or private key. A request for those secrets is not a legitimate payment requirement.",
      ] },
      { id: "optional-wallet", title: "A profile wallet is optional", paragraphs: [
        "You do not need a saved crypto wallet to reserve a TaskReddit mission or submit the proof link. The payment claim email is the next step when the Talentir payout is ready. Use the available payment options shown there instead of relying on older wallet-only instructions.",
        "Before starting your next mission, review its reward, reserve it, and respect the community's rules. Keep your submitted comment online; deleting it after payment can lead to future missions being refused.",
      ] },
    ],
  },
];

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}