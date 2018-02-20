module.exports = async (models) => {
  const { Group, Record, User } = models

  // General
  let [general, generalCreated] = await Group.findOrCreate({
    where: { name: 'general' },
    defaults: {
      fields: {
        name: {}
      }
    }
  })

  if (generalCreated) {
    await Record.create({
      group_id: general.id,
      content: {
        name: "Scott"
      }
    })
  }

  // About
  let [about, aboutCreated] = await Group.findOrCreate({
    where: { name: 'about' },
    defaults: {
      fields: {
        name: {},
        bio: {}
      }
    }
  })

  if (aboutCreated) {
    await Record.create({
      group_id: about.id,
      content: {
        name: "Robbin & Co.",
        bio: "Lives in Evanston."
      }
    })
  }
}

