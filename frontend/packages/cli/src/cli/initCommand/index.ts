import fs from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process'
import { Command } from 'commander'
import inquirer from 'inquirer'
import * as yocto from 'yoctocolors'
import {
  DbOrmDiscussionUrl,
  DiscussionUrl,
  DocsUrl,
  RepositoryUrl,
} from '../urls.js'

const initCommand = new Command('init').description(
  'guide you interactively through the setup',
)

// Map user-friendly selections to the correct --format value
const formatMap: Record<string, string> = {
  PostgreSQL: 'postgresql',
  'Ruby on Rails (schema.rb)': 'schemarb',
  'Prisma (schema.prisma)': 'prisma',
  Drizzle: 'postgresql', // Drizzle also uses --format postgres
}

initCommand.action(async () => {
  console.info(`
👾  Welcome to the @liam-hq/cli setup process! 👾

This \`init\` subcommand will guide you interactively through the setup.

${yocto.greenBright('🌟 This init command is a work in progress! 🌟')}
We’re continuously improving it. Don’t forget to run \`npx @liam-hq/cli init\` after updates for the latest features.

💡 Have feedback? Share it with us!
Visit ${yocto.blueBright(DiscussionUrl)} to submit ideas or report issues.

🌟️ ${yocto.bold('Love Liam ERD')}? Help us grow by starring our GitHub repository:  
${yocto.blueBright(RepositoryUrl)}

----
Now, let’s get started with setting up your Liam ERD project.
  `)

  //
  // Step 1: Ask which technology/ORM the user is using
  //
  const { dbOrOrm } = await inquirer.prompt<{ dbOrOrm: string }>([
    {
      type: 'list',
      name: 'dbOrOrm',
      message: 'Which Technology (database or ORM) are you using?',
      choices: [
        'PostgreSQL',
        'Ruby on Rails (schema.rb)',
        'Prisma (schema.prisma)',
        'Drizzle',
        'Others (MySQL, SQLite, etc.)',
      ],
      default: 'PostgreSQL',
    },
  ])

  //
  // Step 2: Depending on dbOrOrm, ask follow-up questions
  //
  let inputFilePath = ''
  let cannotSupportNow = false

  if (dbOrOrm === 'PostgreSQL') {
    // Ask if pg_dump .sql can be used
    const { usePgDump } = await inquirer.prompt<{ usePgDump: boolean }>([
      {
        type: 'confirm',
        name: 'usePgDump',
        message:
          'Can we use an .sql file generated by pg_dump? (Recommended: `pg_dump --schema-only`)',
        default: false,
      },
    ])

    if (usePgDump) {
      // If yes, ask for the path
      const { dumpFilePath } = await inquirer.prompt<{ dumpFilePath: string }>([
        {
          type: 'input',
          name: 'dumpFilePath',
          message: 'What is your dump file path?',
          default: 'dump.sql',
        },
      ])
      inputFilePath = dumpFilePath
    } else {
      // If no, do not ask for path—just inform
      console.info(`
${yocto.yellow(
  'Please run `pg_dump --schema-only` later to generate a dump file you can use with Liam ERD.',
)}
`)
    }
  } else if (dbOrOrm === 'Drizzle') {
    const { usePostgres } = await inquirer.prompt<{ usePostgres: boolean }>([
      {
        type: 'confirm',
        name: 'usePostgres',
        message: 'Using PostgreSQL?',
        default: false,
      },
    ])

    if (usePostgres) {
      // Show Drizzle-specific guidance
      console.info(`
${yocto.yellow(
  `For Drizzle, please run your DB migrations, then use 'pg_dump --schema-only' to generate a dump file. You can then use it with --format postgresql.`,
)}
`)
    } else {
      cannotSupportNow = true
    }
  } else if (dbOrOrm === 'Others (MySQL, SQLite, etc.)') {
    cannotSupportNow = true
  } else {
    // For Rails/Prisma, we do ask for the schema file path
    let defaultSchemaPath = ''
    if (dbOrOrm === 'Ruby on Rails (schema.rb)') {
      defaultSchemaPath = 'db/schema.rb'
    } else if (dbOrOrm === 'Prisma (schema.prisma)') {
      defaultSchemaPath = 'prisma/schema.prisma'
    }

    const { schemaFilePath } = await inquirer.prompt<{
      schemaFilePath: string
    }>([
      {
        type: 'input',
        name: 'schemaFilePath',
        message: 'What is your schema file path?',
        default: defaultSchemaPath,
      },
    ])
    inputFilePath = schemaFilePath
  }

  if (cannotSupportNow) {
    console.info(`
💔 ${yocto.yellowBright("For other DBs or ORMs, Sorry we don't support them yet")} 💔

Visit ${yocto.yellowBright(DbOrmDiscussionUrl)} to suggest support for your database or ORM!

For more details about Liam ERD usage and advanced configurations, check out:
${yocto.blueBright(DocsUrl)}
`)
    exit(0)
  }

  //
  // Step 3: Ask if the user wants GitHub Actions
  //
  const { addGhActions } = await inquirer.prompt<{ addGhActions: boolean }>([
    {
      type: 'confirm',
      name: 'addGhActions',
      message: 'Generate GitHub Actions Workflow?',
      default: false,
    },
  ])

  //
  // Determine the --format value based on user selection
  //
  const selectedFormat = formatMap[dbOrOrm] || 'postgresql'

  //
  // Show docs link
  //
  console.info(`
For more details about Liam ERD usage and advanced configurations, check out:
${yocto.blueBright(DocsUrl)}
`)

  //
  // Next Steps
  //
  console.info('\n--- Next Steps ---')

  if (dbOrOrm === 'Drizzle' && !inputFilePath) {
    // If user is using Drizzle but didn't specify any input file,
    // advise them to eventually produce a dump file.
    console.info(
      '1) After you generate a dump file via pg_dump --schema-only, run:',
    )
    console.info(
      yocto.blueBright(
        '   $ npx @liam-hq/cli erd build --input <dump.sql> --format postgresql',
      ),
    )
  } else if (inputFilePath) {
    console.info(
      '1) Build your ERD from the specified file using the following command:',
    )
    console.info(
      yocto.blueBright(
        `   $ npx @liam-hq/cli erd build --input ${inputFilePath} --format ${selectedFormat}`,
      ),
    )
  } else {
    // If the user didn't specify a dump file (e.g., said "No" to pg_dump)
    console.info(
      '1) Once you generate a dump file, build your ERD using the following command:',
    )
    console.info(
      yocto.blueBright(
        '   $ npx @liam-hq/cli erd build --input <dump.sql> --format postgresql',
      ),
    )
  }

  console.info('\n2) Start your favorite httpd for serving dist. e.g.:')
  console.info(yocto.blueBright('   $ npx http-server dist'))

  //
  // (Optional) Generate GitHub Actions file
  //
  if (addGhActions) {
    // The user might not have a path if they chose "No" to pg_dump or if Drizzle was chosen
    const effectivePath = inputFilePath || '<dump.sql>'
    const workflowContent = `name: ERD Build
on:
  push:
    branches: [ "main" ]

jobs:
  build-erd:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate ER Diagrams
        run: npx @liam-hq/cli erd build --input ${effectivePath} --format ${selectedFormat}
    
    # - Next step: Deploy ERD \`./dist\` to your preferred hosting service for easy sharing and access.
`

    const workflowDir = path.join(process.cwd(), '.github', 'workflows')
    const workflowPath = path.join(workflowDir, 'erd.yml')

    try {
      fs.mkdirSync(workflowDir, { recursive: true })
      fs.writeFileSync(workflowPath, workflowContent, 'utf-8')
      console.info(
        yocto.greenBright(
          `\n✔ Created GitHub Actions workflow at: ${workflowPath}\n`,
        ),
      )
    } catch (err) {
      console.error(
        yocto.redBright(
          `\nFailed to create GitHub Actions workflow file: ${err}\n`,
        ),
      )
    }
  }

  console.info(
    yocto.greenBright(`
✅ Setup complete! Enjoy using Liam ERD to visualize your database schema!`),
  )
})

export { initCommand }
