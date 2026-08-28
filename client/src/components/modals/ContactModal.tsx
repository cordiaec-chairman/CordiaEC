import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { submitContact } from "@/lib/queries";
import { useT, useLang } from "@/lib/i18n";

type ContactFormData = { name: string; email: string; message: string };

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubject?: string;
}

export default function ContactModal({ open, onOpenChange, defaultSubject }: ContactModalProps) {
  const { toast } = useToast();
  const t = useT();
  const { lang } = useLang();

  // 언어에 따라 유효성 검사 메시지 분기
  const contactFormSchema = z.object({
    name: z.string()
      .min(1, t("contact.validationName"))
      .min(2, t("contact.validationNameMin")),
    email: z.string()
      .min(1, t("contact.validationEmail"))
      .email(t("contact.validationEmailFormat")),
    message: z.string()
      .min(1, t("contact.validationMessage"))
      .min(10, t("contact.validationMessageMin")),
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: defaultSubject
        ? (lang === "ko" ? `문의 제목: ${defaultSubject}\n\n` : `Subject: ${defaultSubject}\n\n`)
        : "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: submitContact,
    onSuccess: () => {
      toast({
        title: t("contact.successTitle"),
        description: t("contact.successDesc"),
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: t("contact.errorTitle"),
        description: error.message || t("contact.errorDesc"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-contact">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cordia-dark">{t("contact.modalTitle")}</DialogTitle>
        </DialogHeader>
        
        <p className="text-gray-600 mb-6">
          {t("contact.modalDesc")}
        </p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact.labelName")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("contact.placeholderName")} 
                      {...field} 
                      data-testid="input-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact.labelEmail")}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder={t("contact.placeholderEmail")} 
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contact.labelMessage")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("contact.placeholderMessage")} 
                      rows={4} 
                      className="resize-none" 
                      {...field}
                      data-testid="input-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {t("contact.btnCancel")}
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-cordia-blue hover:bg-blue-600" 
                disabled={contactMutation.isPending}
                data-testid="button-submit"
              >
                {contactMutation.isPending ? t("contact.btnSending") : t("contact.btnSubmit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
