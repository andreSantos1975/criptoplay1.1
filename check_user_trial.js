const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const email = 'andredev1975@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email: email },
    select: {
      id: true,
      email: true,
      username: true,
      subscriptionStatus: true,
      trialEndsAt: true
    }
  });
  
  console.log('User Data:', user);
  
  if (user && user.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(user.trialEndsAt);
      console.log('Current Time:', now.toISOString());
      console.log('Trial Ends:', trialEnd.toISOString());
      console.log('Is Trial Future?', trialEnd > now);
  }
}

checkUser()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
