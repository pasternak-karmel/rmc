"use client";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { Activity, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  const { data: session } = useSession();
  const isConnected = session?.user?.email;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="container px-4 sm:px-6 py-4 mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold w-full sm:w-auto justify-center sm:justify-start"
            >
              <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>Health Care</span>
            </Link>

            <nav className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-center sm:justify-end">
              {isConnected ? (
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    <span>Dashboard</span>
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="px-3 sm:px-4 w-full sm:w-auto"
                  >
                    <Link href="/auth/sign-in">Connexion</Link>
                  </Button>
                  <Button asChild className="px-3 sm:px-4 w-full sm:w-auto">
                    <Link href="/auth/sign-up">Inscription</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Votre santé, <span className="text-primary">simplifiée</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            La solution tout-en-un pour gérer vos rendez-vous médicaux et suivre
            votre santé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="px-8 py-6 text-lg">
              <Link href={isConnected ? "/dashboard" : "/auth/sign-in"}>
                Commencer gratuitement
              </Link>
            </Button>
            <Button variant="outline" asChild className="px-8 py-6 text-lg">
              <Link href="#features">En savoir plus</Link>
            </Button>
          </div>
        </div>

        <div className="md:w-1/2">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-xl aspect-video flex items-center justify-center">
            <Image
              src="/images/preview-application.png"
              alt="Aperçu de l'application Health Care"
              width={600}
              height={300}
              className="object-cover rounded-xl"
            />
          </div>
        </div>
      </main>
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 dark:border-slate-700">
              <Image
                src="/images/medecin-patient-rein.png"
                alt="Médecin assistant un patient atteint de maladie rénale chronique"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-3xl font-bold">
              Accompagnement expert pour les maladies rénales
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              &quot;Votre équipe soignante à vos côtés à chaque étape de votre
              parcours rénal, pour un suivi personnalisé et une meilleure
              qualité de vie.&quot;
            </p>
            <ul className="space-y-3 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Surveillance régulière de votre fonction rénale</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Plan de traitement adapté à votre situation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Conseils nutritionnels spécialisés</span>
              </li>
            </ul>
            <Button asChild className="mt-4">
              <Link href="/contact">
                Prendre rendez-vous avec un néphrologue
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section id="features" className="py-16 bg-slate-100 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Fonctionnalités clés
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestion de rendez-vous",
                description: "Planifiez et suivez vos consultations médicales",
                icon: <Activity className="h-8 w-8 text-primary" />,
                image: "/images/calendar-image.jpeg",
              },
              {
                title: "Dossiers médicaux",
                description: "Accédez à vos documents en toute sécurité",
                icon: <Activity className="h-8 w-8 text-primary" />,
                image: "/images/dossiers-medicaux.jpeg",
              },
              {
                title: "Suivi personnalisé",
                description: "Visualisez vos indicateurs de santé",
                icon: <Activity className="h-8 w-8 text-primary" />,
                image: "/images/workflow-de-suivi.png",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className="relative mb-4 rounded-lg overflow-hidden aspect-video bg-slate-200 dark:bg-slate-700">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-11">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-50 dark:bg-slate-950 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Health Care</span>
              </div>
              <p className="text-slate-400">
                Votre partenaire santé pour un suivi médical personnalisé et
                simplifié.
              </p>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Colonne 2 - Liens utiles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    href="/rendez-vous"
                    className="hover:text-primary transition-colors"
                  >
                    Prendre rendez-vous
                  </Link>
                </li>
                <li>
                  <Link
                    href="/medecins"
                    className="hover:text-primary transition-colors"
                  >
                    Trouver un médecin
                  </Link>
                </li>
                <li>
                  <Link
                    href="/suivi"
                    className="hover:text-primary transition-colors"
                  >
                    Suivi médical
                  </Link>
                </li>
                <li>
                  <Link
                    href="/urgences"
                    className="hover:text-primary transition-colors"
                  >
                    Urgences
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    href="/mentions-legales"
                    className="hover:text-primary transition-colors"
                  >
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/confidentialite"
                    className="hover:text-primary transition-colors"
                  >
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="hover:text-primary transition-colors"
                  >
                    Gestion des cookies
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cgv"
                    className="hover:text-primary transition-colors"
                  >
                    CGU/CGV
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact</h3>
              <address className="not-italic text-slate-400 space-y-2">
                <p>123 Rue de la Santé</p>
                <p>75000 Cotonou, Akpakpa</p>
                <p>
                  <Link
                    href="tel:+33123456789"
                    className="hover:text-primary transition-colors"
                  >
                    +229 01 23 45 67 89
                  </Link>
                </p>
                <p>
                  <Link
                    href="mailto:contact@healthcare.com"
                    className="hover:text-primary transition-colors"
                  >
                    contact@healthcare.com
                  </Link>
                </p>
              </address>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Health Care. Tous droits réservés.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link
                href="/accessibilite"
                className="text-sm text-slate-500 hover:text-primary transition-colors"
              >
                Accessibilité
              </Link>
              <Link
                href="/plan-du-site"
                className="text-sm text-slate-500 hover:text-primary transition-colors"
              >
                Plan du site
              </Link>
              <Link
                href="/faq"
                className="text-sm text-slate-500 hover:text-primary transition-colors"
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
