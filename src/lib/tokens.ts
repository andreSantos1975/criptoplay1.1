import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  // Expira em 24 horas
  const expires = new Date(new Date().getTime() + 24 * 3600 * 1000); 

  // Verifica se já existe um token para esse email e remove (opcional, mas limpa o banco)
  // Como o modelo VerificationToken usa identificador + token como unique, 
  // e identifier geralmente é o email, vamos buscar pelo identifier.
  
  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email }
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token
        }
      }
    });
  }

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    }
  });

  return verificationToken;
};
