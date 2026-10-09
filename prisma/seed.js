const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // TRUNCATE empties the tables AND resets auto-increment ID counters back to 1.
  // CASCADE automatically handles clearing child dependencies in order.
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Comments", "Likes", "Follower", "Wuphf", "WuphfUser", "User", "Avatar" RESTART IDENTITY CASCADE;`,
  )

  const Avatar = await prisma.avatar.createMany({
    data: [
      {
        url: 'animal_svgs/dog_nau7in.svg',
        name: 'Dog',
      },
      {
        url: 'animal_svgs/cat_hizjv6.svg',
        name: 'Cat',
      },
      {
        url: 'animal_svgs/bird_wlfceb.svg',
        name: 'Bird',
      },
      {
        url: 'animal_svgs/owl_xnejqi.svg',
        name: 'Owl',
      },
      {
        url: 'animal_svgs/monkey_ywewbg.svg',
        name: 'Monkey',
      },
      {
        url: 'animal_svgs/bunny_tgvcdh.svg',
        name: 'Bunny',
      },
      {
        url: 'animal_svgs/panda_fb7grl.svg',
        name: 'Panda',
      },
    ],
  })

  const users = await prisma.user.createMany({
    data: [
      {
        name: 'John Doe',
        email: 'johndoe@gmail.com',
        image: 'https://www.johndoe.com/',
        id: 'abc123',
      },
      {
        name: 'Jane Doe',
        email: 'janedoe@gmail.com',
        image: 'https://www.janedoe.com/',
        id: 'def123',
      },
      {
        name: 'Steve Smith',
        email: 'stevesmith@gmail.com',
        image: 'https://www.stevesmith.com/',
        id: 'zzz',
      },
    ],
    skipDuplicates: true,
  })

  const wuphfUsers = await prisma.wuphfUser.createMany({
    data: [
      {
        userName: 'johndoe',
        email: 'johndoe@gmail.com',
        bio: 'hi I am john',
        avatarId: 1,
      },
      {
        userName: 'janedoe',
        email: 'janedoe@gmail.com',
        bio: 'hi I am jane',
        avatarId: 4,
      },
      {
        userName: 'stevesmith',
        email: 'stevesmith@gmail.com',
        bio: 'hi I am steve',
        avatarId: 3,
      },
    ],
    skipDuplicates: true,
  })

  const wuphfs = await prisma.wuphf.createMany({
    data: [
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's post",
        createdAt: new Date('1/1/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 2nd post",
        createdAt: new Date('1/2/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 3rd post",
        createdAt: new Date('1/3/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 4th post",
        createdAt: new Date('1/4/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 5th post",
        createdAt: new Date('1/5/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 6th post",
        createdAt: new Date('1/6/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 7th post",
        createdAt: new Date('1/7/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 8th post",
        createdAt: new Date('1/8/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 9th post",
        createdAt: new Date('1/9/22'),
      },
      {
        userId: 'johndoe',
        pictureUrl: 'url',
        postBody: "This is John's 10th post",
        createdAt: new Date('1/10/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's post",
        createdAt: new Date('1/11/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 2nd post",
        createdAt: new Date('1/12/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 3rd post",
        createdAt: new Date('1/13/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 4th post",
        createdAt: new Date('1/14/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 5th post",
        createdAt: new Date('1/15/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 6th post",
        createdAt: new Date('1/16/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 7th post",
        createdAt: new Date('1/17/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 8th post",
        createdAt: new Date('1/18/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 9th post",
        createdAt: new Date('1/19/22'),
      },
      {
        userId: 'janedoe',
        pictureUrl: 'url2',
        postBody: "This is Jane's 10th post",
        createdAt: new Date('1/20/22'),
      },
    ],
    skipDuplicates: true,
  })

  const comments = await prisma.comments.create({
    data: {
      postsId: 1,
      commentBody: "Hi, this is Jane's comment",
      userId: 'janedoe',
    },
  })

  const likes = await prisma.likes.create({
    data: {
      userId: 'janedoe',
      wuphfId: 1,
    },
  })

  const follows = await prisma.follower.create({
    data: {
      userId: 'janedoe',
      followerId: 'johndoe',
    },
  })

  console.log({ users, wuphfUsers, wuphfs, comments, likes, follows })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
