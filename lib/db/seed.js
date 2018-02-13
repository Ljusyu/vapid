module.exports = async (models) => {
  const { Group, Record, User } = models

  await Group.findOrCreate({
    where: { name: 'default' },
    defaults: {
      fields: {
        name: {}
      },
      Record: {
        content: { name: "Scott" }
      }
    },
    include: Record
  })

  // TODO: How to create the record association?
  console.log(await Record.findAll())
}

