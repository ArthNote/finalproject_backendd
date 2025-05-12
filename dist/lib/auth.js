"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.stripeClient = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = require("./prisma");
const plugins_1 = require("better-auth/plugins");
const resend_1 = require("./resend");
const stripe_1 = require("@better-auth/stripe");
const stripe_2 = __importDefault(require("stripe"));
exports.stripeClient = new stripe_2.default(process.env.STRIPE_SECRET_KEY);
const frontEndUrl = process.env.BETTER_AUTH_URL;
const getUrl = (token, locale) => {
    return `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}&callbackURL=${frontEndUrl}/${locale}/dashboard`;
};
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_1.prismaAdapter)(prisma_2.db, {
        provider: "postgresql",
    }),
    appName: "taskflow.",
    baseURL: process.env.BACKEND_URL,
    trustedOrigins: [
        process.env.FRONTEND_WEB_URL,
        "http://localhost:3000",
        "https://taskflow-note.netlify.app",
    ],
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
        sendResetPassword: (_a, request_1) => __awaiter(void 0, [_a, request_1], void 0, function* ({ user, url, token }, request) {
            const u = request === null || request === void 0 ? void 0 : request.headers.get("cookie");
            const match = u === null || u === void 0 ? void 0 : u.match(/NEXT_LOCALE=([^;]+)/);
            const nextLocale = match ? match[1] : "Not found";
            yield (0, resend_1.sendEmail)({
                email: user.email,
                subject: nextLocale === "en"
                    ? "Reset your password"
                    : "Réinitialiser votre mot de passe",
                html: nextLocale === "en"
                    ? `Click <a href="${url}">here</a> to reset your password.`
                    : `Cliquez <a href="${url}">ici</a> pour réinitialiser votre mot de passe.`,
            });
        }),
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: (_a, request_1) => __awaiter(void 0, [_a, request_1], void 0, function* ({ user, url, token }, request) {
            const u = request === null || request === void 0 ? void 0 : request.headers.get("cookie");
            const match = u === null || u === void 0 ? void 0 : u.match(/NEXT_LOCALE=([^;]+)/);
            const nextLocale = match ? match[1] : "Not found";
            const urL = getUrl(token, nextLocale);
            yield (0, resend_1.sendEmail)({
                email: user.email,
                subject: nextLocale === "fr"
                    ? "Vérifiez votre adresse e-mail"
                    : "Verify your email address",
                html: nextLocale === "en"
                    ? `Click <a href="${urL}">here</a> to verify your email.`
                    : `Cliquez <a href="${urL}">ici</a> pour vérifier votre adresse e-mail.`,
                req: request,
            });
        }),
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            display: "touch",
            // getUserInfo: async (token) => {
            //   // Implement Google user info fetching logic here
            //   return {
            //     user: {
            //       id: 'google-user-id', // Replace with actual ID from Google
            //       name: 'Google User',  // Replace with actual name
            //       email: 'user@example.com', // Replace with actual email
            //       emailVerified: true,
            //       image
            //     },
            //     data: {} // Additional data if needed
            //   };
            // },
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            redirectURI: `${frontEndUrl}/en/dashboard`,
            enabled: false,
        },
        twitter: {
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            enabled: false,
            redirectURI: `${frontEndUrl}/en/dashboard`,
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        },
        linkedin: {
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            redirectURI: `${frontEndUrl}/en/dashboard`,
            enabled: false,
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
        },
    },
    user: {
        additionalFields: {
            lang: {
                type: "string",
                required: true,
            },
            activeOrganizationId: {
                type: "string",
                required: false,
            },
        },
        deleteUser: {
            enabled: true,
            sendDeleteAccountVerification: (_a, request_1) => __awaiter(void 0, [_a, request_1], void 0, function* ({ user, url, token }, request) {
                const u = request === null || request === void 0 ? void 0 : request.headers.get("cookie");
                const match = u === null || u === void 0 ? void 0 : u.match(/NEXT_LOCALE=([^;]+)/);
                const nextLocale = match ? match[1] : "Not found";
                const urL = getUrl(token, nextLocale);
                yield (0, resend_1.sendEmail)({
                    email: user.email,
                    subject: nextLocale === "en"
                        ? "Delete your account"
                        : "Supprimer votre compte",
                    html: nextLocale === "en"
                        ? `Click <a href="${url}">here</a> to delete your account.`
                        : `Cliquez <a href="${url}">ici</a> pour supprimer votre compte.`,
                    req: request,
                });
            }),
        },
        changeEmail: {
            enabled: true,
        },
    },
    advanced: {
        generateId: false,
        session: {
            maxAge: 30 * 24 * 60 * 60,
            updateAge: 24 * 60 * 60,
        },
        // useSecureCookies: true,
        // defaultCookieAttributes: {
        //   secure: true,
        //   path: "/",
        //   httpOnly: true,
        //   sameSite: "none", // Required for cross-site cookies
        // },
        // crossSubDomainCookies: {
        //   enabled: true,
        //   // domain: process.env.COOKIE_DOMAIN || undefined,
        // },
        // useSecureCookies: true,
        // defaultCookieAttributes: {
        //   secure: true,
        //   // domain: process.env.COOKIE_DOMAIN || undefined,
        //   path: "/",
        //   // httpOnly: true,
        //   sameSite: "none", // Allows CORS-based cookie sharing across subdomains
        //   // partitioned: true, // New browser standards will mandate this for foreign cookies
        // }, // Add a custom prefix for better identification
    },
    // hooks: {
    //   after: createAuthMiddleware(async (ctx) => {
    //     if (ctx.path === "/sign-up/email") {
    //       return {
    //         context: {
    //           ...ctx,
    //           body: {
    //             ...ctx.body,
    //             name: "John Doe",
    //           },
    //         },
    //       };
    //     }
    //   }),
    // },
    plugins: [
        (0, plugins_1.username)(),
        (0, plugins_1.twoFactor)(),
        (0, stripe_1.stripe)({
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            stripeClient: exports.stripeClient,
            createCustomerOnSignUp: true,
            subscription: {
                enabled: true,
                organization: {
                    enabled: true,
                },
                authorizeReference(_a, request_1) {
                    return __awaiter(this, arguments, void 0, function* ({ action, referenceId, session, user }, request) {
                        if (action === "upgrade-subscription" ||
                            action === "cancel-subscription") {
                            const org = yield prisma_2.db.member.findFirst({
                                where: {
                                    organizationId: referenceId,
                                    userId: user.id,
                                },
                            });
                            return (org === null || org === void 0 ? void 0 : org.role) === "owner";
                        }
                        return true;
                    });
                },
                onSubscriptionComplete: (_a, req_1) => __awaiter(void 0, [_a, req_1], void 0, function* ({ event, subscription, stripeSubscription, plan }, req) {
                    console.log("Subscription completed");
                    const price = stripeSubscription.items.data[0].plan.amount / 100;
                    const billing = stripeSubscription.items.data[0].plan.interval;
                    const paymentMethods = yield exports.stripeClient.paymentMethods.list({
                        customer: subscription.stripeCustomerId,
                        type: "card",
                    });
                    const paymentMethodId = paymentMethods.data[0].id;
                    yield exports.stripeClient.customers.update(subscription.stripeCustomerId, {
                        invoice_settings: {
                            default_payment_method: paymentMethodId,
                        },
                    });
                    const prodId = stripeSubscription.items.data[0].price.product;
                    const prod = yield exports.stripeClient.products.retrieve(prodId);
                    const data = yield prisma_2.db.subscription.update({
                        where: {
                            id: subscription.id,
                        },
                        data: {
                            billing: billing,
                            price: price,
                            plan: plan.name.toLowerCase(),
                        },
                    });
                    const user = yield prisma_2.db.user.findFirst({
                        where: {
                            stripeCustomerId: subscription.stripeCustomerId,
                        },
                    });
                    if (prod.name.toLowerCase() === "team") {
                        const org = yield exports.auth.api.createOrganization({
                            headers: req === null || req === void 0 ? void 0 : req.headers,
                            body: {
                                name: `${user === null || user === void 0 ? void 0 : user.name}'s Org`,
                                slug: `${user === null || user === void 0 ? void 0 : user.name}-org`.toLowerCase(),
                                userId: user === null || user === void 0 ? void 0 : user.id,
                                metadata: {
                                    subscriptionId: subscription.id,
                                    plan: "team",
                                },
                            },
                        });
                        // const session = await auth.api.getSession({
                        //   headers: req?.headers!,
                        // });
                        // await db.session.update({
                        //   where: {
                        //     id: session?.session.id,
                        //   },
                        //   data: {
                        //     activeOrganizationId: org?.id,
                        //   },
                        // });
                        yield prisma_2.db.user.update({
                            where: {
                                id: user === null || user === void 0 ? void 0 : user.id,
                            },
                            data: {
                                activeOrganizationId: org === null || org === void 0 ? void 0 : org.id,
                            },
                        });
                        yield prisma_2.db.subscription.update({
                            where: { id: subscription.id },
                            data: {
                                referenceId: org === null || org === void 0 ? void 0 : org.id,
                                seats: 10,
                            },
                        });
                    }
                    // } else {
                    //   const org = await auth.api.createOrganization({
                    //     headers: req?.headers,
                    //     body: {
                    //       name: `${user?.name}'s Org`,
                    //       slug: `${user?.name}-org`.toLowerCase(),
                    //       userId: user?.id,
                    //     },
                    //   });
                    //   const session = await auth.api.getSession({
                    //     headers: req?.headers!,
                    //   });
                    //   await db.session.update({
                    //     where: {
                    //       id: session?.session.id,
                    //     },
                    //     data: {
                    //       activeOrganizationId: org?.id,
                    //     },
                    //   });
                    // }
                    console.log("updated ", data);
                }),
                onSubscriptionUpdate: (_a) => __awaiter(void 0, [_a], void 0, function* ({ event, subscription }) {
                    const stripeSubscription = yield exports.stripeClient.subscriptions.retrieve(subscription.stripeSubscriptionId);
                    const price = stripeSubscription.items.data[0].plan.amount / 100;
                    const billing = stripeSubscription.items.data[0].plan.interval;
                    const prodId = stripeSubscription.items.data[0].price.product;
                    const prod = yield exports.stripeClient.products.retrieve(prodId);
                    // Get the previous subscription data
                    const previousSub = yield prisma_2.db.subscription.findFirst({
                        where: { stripeSubscriptionId: subscription.id },
                    });
                    // Check if upgrading to team plan
                    if (prod.name.toLowerCase() === "team" &&
                        (previousSub === null || previousSub === void 0 ? void 0 : previousSub.plan) !== "team") {
                        const user = yield prisma_2.db.user.findFirst({
                            where: {
                                stripeCustomerId: subscription.stripeCustomerId,
                            },
                        });
                        if (user) {
                            // const org = await db.organization.create({
                            //   data: {
                            //     name: `${user.name}'s Org`,
                            //     slug: `${user.name}-org`.toLowerCase(),
                            //     metadata: JSON.stringify({
                            //       subscriptionId: subscription.id,
                            //       plan: "team",
                            //     }),
                            //     members: {
                            //       create: {
                            //         userId: user.id,
                            //         role: "owner",
                            //       },
                            //     },
                            //   },
                            // });
                            const org = yield exports.auth.api.createOrganization({
                                // headers: req?.headers,
                                body: {
                                    name: `${user.name}'s Org`,
                                    slug: `${user.name}-org`.toLowerCase(),
                                    userId: user.id,
                                    metadata: {
                                        subscriptionId: subscription.id,
                                        plan: "team",
                                    },
                                },
                            });
                            console.log("org created ", org);
                            yield prisma_2.db.user.update({
                                where: {
                                    id: user.id,
                                },
                                data: {
                                    activeOrganizationId: org === null || org === void 0 ? void 0 : org.id,
                                },
                            });
                            yield prisma_2.db.subscription.update({
                                where: { id: subscription.id },
                                data: {
                                    referenceId: org === null || org === void 0 ? void 0 : org.id,
                                    seats: 10,
                                    plan: prod.name.toLowerCase(),
                                    status: stripeSubscription.status,
                                    billing: billing,
                                    price: price,
                                    autoRenew: stripeSubscription.collection_method ===
                                        "charge_automatically",
                                },
                            });
                        }
                    }
                    else {
                        // Regular subscription update without team upgrade
                        yield prisma_2.db.subscription.update({
                            where: {
                                id: subscription.id,
                            },
                            data: {
                                plan: prod.name.toLowerCase(),
                                status: stripeSubscription.status,
                                billing: billing,
                                price: price,
                                autoRenew: stripeSubscription.collection_method ===
                                    "charge_automatically",
                            },
                        });
                    }
                }),
                onSubscriptionCancel: (_a) => __awaiter(void 0, [_a], void 0, function* ({ stripeSubscription, subscription, cancellationDetails, event, }) {
                    console.log("Subscription cancelled");
                    const subscriptionId = subscription.id;
                    yield prisma_2.db.subscription.update({
                        where: {
                            id: subscriptionId,
                        },
                        data: {
                            autoRenew: stripeSubscription.collection_method === "charge_automatically",
                        },
                    });
                    const user = yield prisma_2.db.user.findFirst({
                        where: {
                            stripeCustomerId: subscription.stripeCustomerId,
                        },
                    });
                    const endDate = new Date(stripeSubscription.current_period_end * 1000);
                    const formattedEndDate = endDate.toLocaleDateString((user === null || user === void 0 ? void 0 : user.lang) === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" });
                    (0, resend_1.sendEmail)({
                        email: user === null || user === void 0 ? void 0 : user.email,
                        subject: (user === null || user === void 0 ? void 0 : user.lang) === "en"
                            ? "Your Taskflow subscription has been cancelled"
                            : "Votre abonnement Taskflow a été annulé",
                        html: (user === null || user === void 0 ? void 0 : user.lang) === "en"
                            ? `
                <h2>Your subscription has been cancelled</h2>
                <p>We're sorry to see you go. Your Taskflow subscription has been cancelled as requested.</p>
                <p>You'll still have access to all premium features until <strong>${formattedEndDate}</strong>.</p>
                <p>If you change your mind before this date, you can easily reactivate your subscription from your account settings.</p>
                <p>Thank you for being a Taskflow customer.</p>
              `
                            : `
                <h2>Votre abonnement a été annulé</h2>
                <p>Nous sommes désolés de vous voir partir. Votre abonnement Taskflow a été annulé comme demandé.</p>
                <p>Vous aurez toujours accès à toutes les fonctionnalités premium jusqu'au <strong>${formattedEndDate}</strong>.</p>
                <p>Si vous changez d'avis avant cette date, vous pouvez facilement réactiver votre abonnement depuis les paramètres de votre compte.</p>
                <p>Merci d'avoir été client de Taskflow.</p>
              `,
                    });
                }),
                plans: [
                    {
                        name: "free",
                        priceId: process.env.STRIPE_FREE_MONTHLY_PRICE_ID,
                        annualDiscountPriceId: process.env.STRIPE_FREE_ANNUAL_PRICE_ID,
                        limits: {
                            storage: 5,
                            dailyGeneration: 2,
                        },
                    },
                    {
                        name: "individual",
                        priceId: process.env.STRIPE_INDIVIDUAL_MONTHLY_PRICE_ID,
                        annualDiscountPriceId: process.env.STRIPE_INDIVIDUAL_ANNUAL_PRICE_ID,
                        limits: {
                            storage: 25,
                        },
                        freeTrial: {
                            days: 7,
                            onTrialStart: (subscription) => __awaiter(void 0, void 0, void 0, function* () {
                                const user = yield prisma_2.db.user.findFirst({
                                    where: {
                                        stripeCustomerId: subscription.stripeCustomerId,
                                    },
                                });
                                if (!user)
                                    return;
                                yield (0, resend_1.sendEmail)({
                                    email: user.email,
                                    subject: user.lang === "en" ? "Trial started" : "Essai commencé",
                                    html: user.lang === "en"
                                        ? `Your trial has started. You can start using the app now.`
                                        : `Votre essai a commencé. Vous pouvez commencer à utiliser l'application maintenant.`,
                                });
                            }),
                            onTrialEnd: (_a, request_1) => __awaiter(void 0, [_a, request_1], void 0, function* ({ subscription }, request) {
                                const user = yield prisma_2.db.user.findFirst({
                                    where: {
                                        stripeCustomerId: subscription.stripeCustomerId,
                                    },
                                });
                                if (!user)
                                    return;
                                yield (0, resend_1.sendEmail)({
                                    email: user.email,
                                    subject: user.lang === "en" ? "Trial ended" : "Essai terminé",
                                    html: user.lang === "en"
                                        ? `Your free trial for taskflow has ended. Your subscription has now started, thank you for choosing us!`
                                        : "Votre essai gratuit pour taskflow est terminé. Votre abonnement a maintenant commencé, merci de nous avoir choisis!",
                                });
                            }),
                            onTrialExpired: (subscription) => __awaiter(void 0, void 0, void 0, function* () {
                                const user = yield prisma_2.db.user.findFirst({
                                    where: {
                                        stripeCustomerId: subscription.stripeCustomerId,
                                    },
                                });
                                if (!user)
                                    return;
                                yield (0, resend_1.sendEmail)({
                                    email: user.email,
                                    subject: user.lang === "en" ? "Trial Expired" : "Essai expiré",
                                    html: user.lang === "en"
                                        ? `Your free trial for taskflow has expired. Upgrade now to continue enjoying the service!`
                                        : "Votre essai gratuit pour taskflow a expiré. Mettez à niveau maintenant pour continuer à profiter du service!",
                                });
                            }),
                        },
                    },
                    {
                        name: "team",
                        priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
                        annualDiscountPriceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
                        limits: {
                            storage: 100,
                            seats: 10,
                        },
                        freeTrial: {
                            days: 7,
                            onTrialStart: (subscription) => __awaiter(void 0, void 0, void 0, function* () {
                                const user = yield prisma_2.db.user.findFirst({
                                    where: {
                                        stripeCustomerId: subscription.stripeCustomerId,
                                    },
                                });
                                if (!user)
                                    return;
                                yield (0, resend_1.sendEmail)({
                                    email: user.email,
                                    subject: user.lang === "en" ? "Trial started" : "Essai commencé",
                                    html: user.lang === "en"
                                        ? `Your trial has started. You can start using the app now.`
                                        : `Votre essai a commencé. Vous pouvez commencer à utiliser l'application maintenant.`,
                                });
                            }),
                            onTrialEnd: (_a, request_1) => __awaiter(void 0, [_a, request_1], void 0, function* ({ subscription }, request) {
                                const user = yield prisma_2.db.user.findFirst({
                                    where: {
                                        stripeCustomerId: subscription.stripeCustomerId,
                                    },
                                });
                                if (!user)
                                    return;
                                yield (0, resend_1.sendEmail)({
                                    email: user.email,
                                    subject: user.lang === "en" ? "Trial ended" : "Essai terminé",
                                    html: user.lang === "en"
                                        ? `Your free trial for taskflow has ended. Your subscription has now started, thank you for choosing us!`
                                        : "Votre essai gratuit pour taskflow est terminé. Votre abonnement a maintenant commencé, merci de nous avoir choisis!",
                                });
                            }),
                            onTrialExpired: (subscription) => __awaiter(void 0, void 0, void 0, function* () {
                                const user = yield prisma_2.db.user.findFirst({
                                    where: {
                                        stripeCustomerId: subscription.stripeCustomerId,
                                    },
                                });
                                if (!user)
                                    return;
                                yield (0, resend_1.sendEmail)({
                                    email: user.email,
                                    subject: user.lang === "en" ? "Trial Expired" : "Essai expiré",
                                    html: user.lang === "en"
                                        ? `Your free trial for taskflow has expired. Upgrade now to continue enjoying the service!`
                                        : "Votre essai gratuit pour taskflow a expiré. Mettez à niveau maintenant pour continuer à profiter du service!",
                                });
                            }),
                        },
                    },
                ],
                getCheckoutSessionParams: (data, request) => {
                    return {
                        params: {
                            locale: data.user.lang === "fr" ? "fr" : "en",
                            success_url: `${frontEndUrl}/${data.user.lang}/dashboard`,
                        },
                    };
                },
            },
        }),
        (0, plugins_1.organization)({
            teams: {
                enabled: true,
                maximumTeams: 1,
                allowRemovingAllTeams: false,
            },
            sendInvitationEmail: (data) => __awaiter(void 0, void 0, void 0, function* () {
                const userData = yield prisma_2.db.user.findUnique({
                    where: {
                        email: data.email,
                    },
                });
                const inviteLink = `${frontEndUrl}/${userData === null || userData === void 0 ? void 0 : userData.lang}/team/invite/${data.id}`;
                yield (0, resend_1.sendEmail)({
                    email: data.email,
                    subject: (userData === null || userData === void 0 ? void 0 : userData.lang) === "en"
                        ? `Join ${data.organization.name} on Taskflow`
                        : `Rejoindre ${data.organization.name} sur Taskflow`,
                    html: (userData === null || userData === void 0 ? void 0 : userData.lang) === "en"
                        ? `
            <h2>You've been invited to join ${data.organization.name}</h2>
            <p>${data.inviter.user.name} (${data.inviter.user.email}) has invited you to join their team on Taskflow.</p>
            <p><a href="${inviteLink}">Click here to accept the invitation</a></p>
          `
                        : `
            <h2>Vous avez été invité à rejoindre ${data.organization.name}</h2>
            <p>${data.inviter.user.name} (${data.inviter.user.email}) vous a invité à rejoindre leur équipe sur Taskflow.</p>
            <p><a href="${inviteLink}">Cliquez ici pour accepter l'invitation</a></p>
          `,
                });
            }),
            organizationCreation: {
                beforeCreate: (_a) => __awaiter(void 0, [_a], void 0, function* ({ organization, user }) {
                    const userData = yield prisma_2.db.user.findUnique({
                        where: {
                            id: user.id,
                        },
                    });
                    if (!userData) {
                        throw new Error("User not found");
                    }
                    // Verify team subscription is active
                    const subscription = yield prisma_2.db.subscription.findFirst({
                        where: {
                            stripeCustomerId: userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId,
                            plan: "team",
                            status: {
                                in: ["active", "trialing"],
                            },
                        },
                    });
                    if (!subscription) {
                        throw new Error("Active team subscription required");
                    }
                    return {
                        data: Object.assign(Object.assign({}, organization), { metadata: Object.assign(Object.assign({}, organization.metadata), { subscriptionId: subscription.id }) }),
                    };
                }),
                afterCreate(data, request) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield prisma_2.db.team.create({
                            data: {
                                name: "General",
                                organizationId: data.organization.id,
                                activity: {
                                    create: {
                                        type: "team",
                                        action: "created",
                                        userId: data.user.id,
                                    },
                                },
                            },
                        });
                        // await auth.api
                        //   .createTeam({
                        //     headers: request?.headers,
                        //     body: {
                        //       name: "General",
                        //       organizationId: data.organization.id,
                        //     },
                        //   })
                        //   .then(async (res) => {
                        //     await db.teamActivity.create({
                        //       data: {
                        //         type: "team",
                        //         action: "created",
                        //         userId: data.user.id,
                        //         teamId: res.id,
                        //       },
                        //     });
                        //   });
                    });
                },
            },
        }),
    ],
});
