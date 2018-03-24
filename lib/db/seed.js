module.exports = async (models) => {
  const { Group, Record, User } = models
  console.log("HERE")

  // User
  let user = await User.create({
    email: 'admin@example.com',
    password: 'password',
    password_confirmation: 'password'
  })

  // General
  let [general, generalCreated] = await Group.findOrCreate({
    where: { name: 'general' },
    defaults: {
      fields: {
        name: { type: 'text' },
        birthday: { type: 'date' }
      }
    }
  })

  if (generalCreated) {
    await Record.create({
      group_id: general.id,
      content: {
        name: "HAL",
        birthday: "1997-01-12",
      }
    })
  }

  // About
  let [about, aboutCreated] = await Group.findOrCreate({
    where: { name: 'about' },
    defaults: {
      fields: {
        name: { type: 'text' },
        bio: { type: 'html' }
      }
    }
  })

  // if (aboutCreated) {
  //   await Record.create({
  //     group_id: about.id,
  //     content: {
  //       name: "Robbin & Co.",
  //       bio: "Lives in Evanston."
  //     }
  //   })
  // }
}

