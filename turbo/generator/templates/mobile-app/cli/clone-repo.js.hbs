const { runCommand } = require('./utils.js');
const { consola } = require('consola');

const getLatestRelease = async () => {
  try {
    const repoData = await fetch(
      'https://api.github.com/repos/obytes/react-native-template-obytes/releases/latest'
    );
    const releaseData = await repoData.json();
    return releaseData.tag_name || 'master';
  } catch (error) {
    console.warn(
      'Failed to retrieve the latest release; will use the master branch instead'
    );
    return 'master';
  }
};

const cloneLastTemplateRelease = async (projectName) => {
  consola.start('Extracting last release number 👀');
  const latest_release = await getLatestRelease();
  consola.info(`Using Obytes starter ${latest_release}`);

  // create a new project based on obytes template
  const cloneStarter = `git clone -b ${latest_release} --depth=1   https://github.com/obytes/react-native-template-obytes.git ${projectName}`;
  await runCommand(cloneStarter, {
    loading: 'Extracting the starter template...',
    success: 'Starter extracted successfully',
    error: 'Failed to download and extract template',
  });
};

module.exports = {
  cloneLastTemplateRelease,
};
