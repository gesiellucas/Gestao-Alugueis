
import { GoogleGenAI } from "@google/genai";

// Fixed: Correct initialization using process.env.API_KEY named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWhatsAppMessage = async (clientName: string, debtAmount: number, vehicleModel: string): Promise<string> => {
  try {
    const prompt = `
      Você é um assistente virtual educado e profissional da "MotoFleet Pro", uma locadora de motos.
      Escreva uma mensagem curta e amigável para o WhatsApp cobrando um cliente.
      
      Dados:
      Cliente: ${clientName}
      Valor em aberto: R$ ${debtAmount}
      Moto alugada: ${vehicleModel}
      
      A mensagem deve ser direta, educada, e solicitar o pagamento para evitar bloqueio da moto. Inclua emojis de moto.
      Não coloque "Assunto:". Apenas o texto da mensagem.
    `;

    // Fixed: Call generateContent with model name and contents
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Fixed: Access .text property directly (do not call as a method)
    return response.text || "Erro ao gerar mensagem.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Olá ${clientName}, por favor entre em contato sobre sua fatura de R$ ${debtAmount}.`;
  }
};

export const summarizeDailyWorkshop = async (records: any[]): Promise<string> => {
  try {
    const recordsText = JSON.stringify(records.map(r => ({
      moto: r.vehicle_plate,
      tipo: r.type,
      desc: r.description
    })));

    const prompt = `
      Você é o gerente de oficina da MotoFleet.
      Analise os seguintes registros de entrada de motos na oficina HOJE e gere um resumo executivo de 1 parágrafo para o dono da empresa.
      Destaque se houve problemas graves ou se foi só rotina.
      
      Registros: ${recordsText}
    `;

    // Fixed: Use appropriate model and direct generateContent call
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Fixed: Access .text property directly
    return response.text || "Sem resumo disponível.";

  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Não foi possível gerar o resumo automático.";
  }
}
