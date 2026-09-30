import { Injectable, ServiceUnavailableException } from '@nestjs/common';
@Injectable() export class MessagingProviderService {
  async sendWhatsApp(to:string, body?:string, mediaUrl?:string){
    const phoneId=process.env.WHATSAPP_PHONE_NUMBER_ID, token=process.env.WHATSAPP_ACCESS_TOKEN, version=process.env.WHATSAPP_GRAPH_VERSION||'v23.0';
    if(!phoneId||!token) throw new ServiceUnavailableException('WhatsApp provider is not configured');
    const payload:any={messaging_product:'whatsapp',to,type:mediaUrl?'image':'text'};
    if(mediaUrl) payload.image={link:mediaUrl,caption:body||undefined}; else payload.text={body:body||''};
    const res=await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data:any=await res.json(); if(!res.ok) throw new ServiceUnavailableException(data?.error?.message||'WhatsApp send failed');
    return {providerMessageId:data?.messages?.[0]?.id||null};
  }
  async sendSms(to:string, body:string){
    const url=process.env.SMS_API_URL, key=process.env.SMS_API_KEY;
    if(!url||!key) throw new ServiceUnavailableException('SMS provider is not configured');
    const res=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({to,message:body})});
    const data:any=await res.json().catch(()=>({})); if(!res.ok) throw new ServiceUnavailableException(data?.message||'SMS send failed');
    return {providerMessageId:String(data?.id||data?.messageId||'')||null};
  }
}
