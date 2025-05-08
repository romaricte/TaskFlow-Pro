import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User["email"], password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

// Note: Ces fonctions sont commentées car les champs correspondants ne sont pas dans le schéma Prisma actuel
// Pour les utiliser, il faudrait ajouter les champs nécessaires au schéma

/*
// Fonction pour activer/désactiver l'authentification à deux facteurs
export async function updateTwoFactorStatus(userId: User["id"], enable: boolean, secret?: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { 
      twoFactorEnabled: enable,
      twoFactorSecret: secret
    }
  });
}

// Fonction pour mettre à jour le profil utilisateur
export async function updateUserProfile(
  userId: User["id"], 
  data: { firstName?: string; lastName?: string; avatarUrl?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data: data
  });
}
*/

export async function verifyLogin(
  email: User["email"],
  password: string,
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }
  
  // Note: La mise à jour de la date de dernière connexion est désactivée car le champ n'existe pas dans le schéma actuel
  // Pour l'activer, il faudrait ajouter le champ lastLogin au modèle User
  /*
  await prisma.user.update({
    where: { id: userWithPassword.id },
    data: { 
      lastLogin: new Date()
    }
  });
  */

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
