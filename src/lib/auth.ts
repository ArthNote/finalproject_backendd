import { betterAuth, parseCookies } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma";
import {
  admin,
  createAuthMiddleware,
  organization,
  twoFactor,
  username,
} from "better-auth/plugins";
import { sendEmail } from "./resend";
import cookie from "cookie";

import { stripe, Subscription } from "@better-auth/stripe";
import Stripe from "stripe";

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
const frontEndUrl = process.env.BETTER_AUTH_URL!;

const getUrl = (token: string, locale: string) => {
  return `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}&callbackURL=${frontEndUrl}/${locale}/dashboard`;
};

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  appName: "taskflow.",
  baseURL: process.env.BACKEND_URL,
  trustedOrigins: [
    process.env.FRONTEND_WEB_URL!,
    "http://localhost:3000",
    "https://taskflow-note.netlify.app",
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }, request) => {
      const u = request?.headers.get("cookie");
      const match = u?.match(/NEXT_LOCALE=([^;]+)/);
      const nextLocale = match ? match[1] : "Not found";

      await sendEmail({
        email: user.email,
        subject:
          nextLocale === "en"
            ? "Reset your password"
            : "Réinitialiser votre mot de passe",
        html:
          nextLocale === "en"
            ? `Click <a href="${url}">here</a> to reset your password.`
            : `Cliquez <a href="${url}">ici</a> pour réinitialiser votre mot de passe.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const u = request?.headers.get("cookie");
      const match = u?.match(/NEXT_LOCALE=([^;]+)/);
      const nextLocale = match ? match[1] : "Not found";
      const urL = getUrl(token, nextLocale);
      await sendEmail({
        email: user.email,
        subject:
          nextLocale === "fr"
            ? "Vérifiez votre adresse e-mail"
            : "Verify your email address",
        html:
          nextLocale === "en"
            ? `Click <a href="${urL}">here</a> to verify your email.`
            : `Cliquez <a href="${urL}">ici</a> pour vérifier votre adresse e-mail.`,
        req: request,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      redirectURI: `${frontEndUrl}/en/dashboard`,
      enabled: false,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      enabled: false,
      redirectURI: `${frontEndUrl}/en/dashboard`,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
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
      sendDeleteAccountVerification: async ({ user, url, token }, request) => {
        const u = request?.headers.get("cookie");
        const match = u?.match(/NEXT_LOCALE=([^;]+)/);
        const nextLocale = match ? match[1] : "Not found";
        const urL = getUrl(token, nextLocale);
        await sendEmail({
          email: user.email,
          subject:
            nextLocale === "en"
              ? "Delete your account"
              : "Supprimer votre compte",
          html:
            nextLocale === "en"
              ? `Click <a href="${url}">here</a> to delete your account.`
              : `Cliquez <a href="${url}">ici</a> pour supprimer votre compte.`,

          req: request,
        });
      },
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
    username(),
    twoFactor(),
    stripe({
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      stripeClient: stripeClient,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        organization: {
          enabled: true,
        },
        async authorizeReference(
          { action, referenceId, session, user },
          request
        ) {
          if (
            action === "upgrade-subscription" ||
            action === "cancel-subscription"
          ) {
            const org = await db.member.findFirst({
              where: {
                organizationId: referenceId,
                userId: user.id,
              },
            });
            return org?.role === "owner";
          }
          return true;
        },
        onSubscriptionComplete: async (
          { event, subscription, stripeSubscription, plan },
          req
        ) => {
          console.log("Subscription completed");

          const price = stripeSubscription.items.data[0].plan.amount! / 100;
          const billing = stripeSubscription.items.data[0].plan.interval;

          const paymentMethods = await stripeClient.paymentMethods.list({
            customer: subscription.stripeCustomerId!,
            type: "card",
          });

          const paymentMethodId = paymentMethods.data[0].id;
          await stripeClient.customers.update(subscription.stripeCustomerId!, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });

          const prodId = stripeSubscription.items.data[0].price.product;
          const prod = await stripeClient.products.retrieve(prodId as string);

          const data = await db.subscription.update({
            where: {
              id: subscription.id,
            },
            data: {
              billing: billing,
              price: price,
              plan: plan.name.toLowerCase(),
            },
          });

          const user = await db.user.findFirst({
            where: {
              stripeCustomerId: subscription.stripeCustomerId,
            },
          });

          if (prod.name.toLowerCase() === "team") {
            const org = await auth.api.createOrganization({
              headers: req?.headers,
              body: {
                name: `${user?.name}'s Org`,
                slug: `${user?.name}-org`.toLowerCase(),
                userId: user?.id,
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

            await db.user.update({
              where: {
                id: user?.id,
              },
              data: {
                activeOrganizationId: org?.id,
              },
            });

            await db.subscription.update({
              where: { id: subscription.id },
              data: {
                referenceId: org?.id,
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
        },
        onSubscriptionUpdate: async ({ event, subscription }) => {
          const stripeSubscription = await stripeClient.subscriptions.retrieve(
            subscription.stripeSubscriptionId!
          );
          const price = stripeSubscription.items.data[0].plan.amount! / 100;
          const billing = stripeSubscription.items.data[0].plan.interval;

          const prodId = stripeSubscription.items.data[0].price.product;
          const prod = await stripeClient.products.retrieve(prodId as string);

          // Get the previous subscription data
          const previousSub = await db.subscription.findFirst({
            where: { stripeSubscriptionId: subscription.id },
          });

          // Check if upgrading to team plan
          if (
            prod.name.toLowerCase() === "team" &&
            previousSub?.plan !== "team"
          ) {
            const user = await db.user.findFirst({
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
              const org = await auth.api.createOrganization({
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

              await db.user.update({
                where: {
                  id: user.id,
                },
                data: {
                  activeOrganizationId: org?.id,
                },
              });

              await db.subscription.update({
                where: { id: subscription.id },
                data: {
                  referenceId: org?.id,
                  seats: 10,
                  plan: prod.name.toLowerCase(),
                  status: stripeSubscription.status,
                  billing: billing,
                  price: price,
                  autoRenew:
                    stripeSubscription.collection_method ===
                    "charge_automatically",
                },
              });
            }
          } else {
            // Regular subscription update without team upgrade
            await db.subscription.update({
              where: {
                id: subscription.id,
              },
              data: {
                plan: prod.name.toLowerCase(),
                status: stripeSubscription.status,
                billing: billing,
                price: price,
                autoRenew:
                  stripeSubscription.collection_method ===
                  "charge_automatically",
              },
            });
          }
        },
        onSubscriptionCancel: async ({
          stripeSubscription,
          subscription,
          cancellationDetails,
          event,
        }) => {
          console.log("Subscription cancelled");
          const subscriptionId = subscription.id;
          await db.subscription.update({
            where: {
              id: subscriptionId,
            },
            data: {
              autoRenew:
                stripeSubscription.collection_method === "charge_automatically",
            },
          });

          const user = await db.user.findFirst({
            where: {
              stripeCustomerId: subscription.stripeCustomerId,
            },
          });

          const endDate = new Date(
            stripeSubscription.current_period_end * 1000
          );
          const formattedEndDate = endDate.toLocaleDateString(
            user?.lang === "fr" ? "fr-FR" : "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          );

          sendEmail({
            email: user?.email!,
            subject:
              user?.lang === "en"
                ? "Your Taskflow subscription has been cancelled"
                : "Votre abonnement Taskflow a été annulé",
            html:
              user?.lang === "en"
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
        },
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
            annualDiscountPriceId:
              process.env.STRIPE_INDIVIDUAL_ANNUAL_PRICE_ID,
            limits: {
              storage: 25,
            },
            freeTrial: {
              days: 7,
              onTrialStart: async (subscription) => {
                const user = await db.user.findFirst({
                  where: {
                    stripeCustomerId: subscription.stripeCustomerId,
                  },
                });
                if (!user) return;

                await sendEmail({
                  email: user.email!,
                  subject:
                    user.lang === "en" ? "Trial started" : "Essai commencé",
                  html:
                    user.lang === "en"
                      ? `Your trial has started. You can start using the app now.`
                      : `Votre essai a commencé. Vous pouvez commencer à utiliser l'application maintenant.`,
                });
              },
              onTrialEnd: async ({ subscription }, request) => {
                const user = await db.user.findFirst({
                  where: {
                    stripeCustomerId: subscription.stripeCustomerId,
                  },
                });
                if (!user) return;
                await sendEmail({
                  email: user.email!,
                  subject: user.lang === "en" ? "Trial ended" : "Essai terminé",
                  html:
                    user.lang === "en"
                      ? `Your free trial for taskflow has ended. Your subscription has now started, thank you for choosing us!`
                      : "Votre essai gratuit pour taskflow est terminé. Votre abonnement a maintenant commencé, merci de nous avoir choisis!",
                });
              },
              onTrialExpired: async (subscription) => {
                const user = await db.user.findFirst({
                  where: {
                    stripeCustomerId: subscription.stripeCustomerId,
                  },
                });
                if (!user) return;
                await sendEmail({
                  email: user.email!,
                  subject:
                    user.lang === "en" ? "Trial Expired" : "Essai expiré",
                  html:
                    user.lang === "en"
                      ? `Your free trial for taskflow has expired. Upgrade now to continue enjoying the service!`
                      : "Votre essai gratuit pour taskflow a expiré. Mettez à niveau maintenant pour continuer à profiter du service!",
                });
              },
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
              onTrialStart: async (subscription) => {
                const user = await db.user.findFirst({
                  where: {
                    stripeCustomerId: subscription.stripeCustomerId,
                  },
                });
                if (!user) return;
                await sendEmail({
                  email: user.email!,
                  subject:
                    user.lang === "en" ? "Trial started" : "Essai commencé",
                  html:
                    user.lang === "en"
                      ? `Your trial has started. You can start using the app now.`
                      : `Votre essai a commencé. Vous pouvez commencer à utiliser l'application maintenant.`,
                });
              },
              onTrialEnd: async ({ subscription }, request) => {
                const user = await db.user.findFirst({
                  where: {
                    stripeCustomerId: subscription.stripeCustomerId,
                  },
                });
                if (!user) return;
                await sendEmail({
                  email: user.email!,
                  subject: user.lang === "en" ? "Trial ended" : "Essai terminé",
                  html:
                    user.lang === "en"
                      ? `Your free trial for taskflow has ended. Your subscription has now started, thank you for choosing us!`
                      : "Votre essai gratuit pour taskflow est terminé. Votre abonnement a maintenant commencé, merci de nous avoir choisis!",
                });
              },
              onTrialExpired: async (subscription) => {
                const user = await db.user.findFirst({
                  where: {
                    stripeCustomerId: subscription.stripeCustomerId,
                  },
                });
                if (!user) return;
                await sendEmail({
                  email: user.email!,
                  subject:
                    user.lang === "en" ? "Trial Expired" : "Essai expiré",
                  html:
                    user.lang === "en"
                      ? `Your free trial for taskflow has expired. Upgrade now to continue enjoying the service!`
                      : "Votre essai gratuit pour taskflow a expiré. Mettez à niveau maintenant pour continuer à profiter du service!",
                });
              },
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
    organization({
      teams: {
        enabled: true,
        maximumTeams: 1,
        allowRemovingAllTeams: false,
      },
      sendInvitationEmail: async (data) => {
        const userData = await db.user.findUnique({
          where: {
            email: data.email,
          },
        });

        const inviteLink = `${frontEndUrl}/${userData?.lang}/team/invite/${data.id}`;

        await sendEmail({
          email: data.email,
          subject:
            userData?.lang === "en"
              ? `Join ${data.organization.name} on Taskflow`
              : `Rejoindre ${data.organization.name} sur Taskflow`,
          html:
            userData?.lang === "en"
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
      },
      organizationCreation: {
        beforeCreate: async ({ organization, user }) => {
          const userData = await db.user.findUnique({
            where: {
              id: user.id,
            },
          });

          if (!userData) {
            throw new Error("User not found");
          }
          // Verify team subscription is active
          const subscription = await db.subscription.findFirst({
            where: {
              stripeCustomerId: userData?.stripeCustomerId,
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
            data: {
              ...organization,
              metadata: {
                ...organization.metadata,
                subscriptionId: subscription.id,
              },
            },
          };
        },
        async afterCreate(data, request) {
          await db.team.create({
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
        },
      },
    }),
  ],
});

type Session = typeof auth.$Infer.Session;
