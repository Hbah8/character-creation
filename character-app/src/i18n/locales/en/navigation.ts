const navigation = {
  overview: 'Overview',
  characters: 'Characters',
  worlds: 'Worlds',
  combat: 'Combat',
  handbooks: 'Handbooks',
  raceBuilder: 'Race Builder',
  editForm: 'Edit Form',
  preview: 'Preview',
  data: 'Data',
  graph: 'Graph',
  edit: 'Edit',
  powers: 'Powers',
  audio: 'Audio',
  maps: 'Maps',
  loadingPage: 'Loading page…',
  notFound: {
    title: 'Page not found',
    description: 'The address may be incorrect, or the page may have moved.',
    backHome: 'Go to overview',
  },
  routeError: {
    title: 'This page could not be displayed',
    description: 'An unexpected error occurred. You can return to the overview and continue.',
  },
} as const

export default navigation
