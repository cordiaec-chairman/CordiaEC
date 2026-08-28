import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import ContactModal from "@/components/modals/ContactModal";
import { useT } from "@/lib/i18n";

export default function Contact() {
  const t = useT();
  const [contactModalOpen, setContactModalOpen] = useState(false);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-cordia-dark text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-cordia-teal mb-2">
            Get in Touch
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3" data-testid="text-contact-title">
            {t('contact.title')}
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl" data-testid="text-contact-description">
            {t('contact.desc')}
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-bold text-cordia-dark mb-5">Contact Information</h2>
              
              <div className="space-y-6">
                <Card className="border-l-4 border-cordia-teal">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-cordia-teal/10 rounded-lg flex items-center justify-center mr-4">
                        <Mail className="text-cordia-teal text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-cordia-dark mb-1">Email</h3>
                        <p className="text-gray-600" data-testid="text-contact-email">
                          cordiaec@gmail.com
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-cordia-green">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-cordia-green/10 rounded-lg flex items-center justify-center mr-4">
                        <Phone className="text-cordia-green text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-cordia-dark mb-1">Phone</h3>
                        <p className="text-gray-600" data-testid="text-contact-phone">
                          +82-032-860-8265
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-cordia-blue">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-cordia-blue/10 rounded-lg flex items-center justify-center mr-4">
                        <MapPin className="text-cordia-blue text-xl" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-cordia-dark mb-1">Address</h3>
                        <p className="text-gray-600" data-testid="text-contact-address">
                          K-ACADEMIC DIFFUSION RESEARCH CENTER. 100 Inha-ro<br />
                          Michuhol-gu, Incheon 22212, KOREA.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-bold text-cordia-dark mb-4">Business Hours</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>10:00 AM - 4:00 PM KST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday - Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form Card */}
            <div>
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-cordia-dark mb-6">Send us a Message</h2>
                  <p className="text-gray-600 mb-6">
                    Have a question about our programs or want to explore partnership opportunities? 
                    We'd love to hear from you.
                  </p>
                  
                  <div className="text-center">
                    <button 
                      onClick={() => setContactModalOpen(true)}
                      className="bg-cordia-teal text-white px-8 py-4 rounded-lg hover:bg-cordia-green transition-colors font-medium shadow-lg hover:scale-105 transition-all duration-300"
                      data-testid="button-open-contact-form"
                    >
                      Open Contact Form
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-cordia-dark mb-3">What to expect:</h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li>• Response within 24 hours during business days</li>
                      <li>• Dedicated support for partnership inquiries</li>
                      <li>• Multilingual support available</li>
                      <li>• Follow-up consultation if needed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ContactModal 
        open={contactModalOpen} 
        onOpenChange={setContactModalOpen} 
      />
    </Layout>
  );
}