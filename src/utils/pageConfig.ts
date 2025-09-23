import type { PageConfiguration } from './pageTypes.js';

interface PageConfig {
  totalPages: number;
  pages: PageConfiguration[];
  getPageConfiguration(pageNum: number): PageConfiguration;
  getAnswerKeyUrl(pageNum: number): string;
  pageExists(pageNum: number): boolean;
}

export const pageConfig: PageConfig = {
  totalPages: 100,
  
  pages: [
    {
      type: 'list',
      title: 'NFL MVP Challenge',
      description: 'List the NFL Most Valuable Players (2000-2024).',
      items: Array.from({length: 25}, (_, i) => ({
        clue: 2024 - i,  // Using new flexible clue system
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/awards/ap-nfl-mvp-award.htm",
      actionContent: {
        content: "One Year has Co-MVPs bonus points if you get the year and both players right!",
        position: 'right',
        rotation: 3,
        icon: '🧠'
      }
    },
    {
      type: 'list',
      title: 'NFL Defensive Player of the Year',
      description: 'List the NFL Defensive Players of the Year (2015-2024).',
      items: Array.from({length: 10}, (_, i) => ({
        clue: 2024 - i,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/awards/ap-defensive-player-of-the-year.htm"
    },
    {
      type: 'list',
      title: 'NFL Offensive Rookie of the Year',
      description: 'List the NFL Offensive Rookies of the Year (2015-2024).',
      items: Array.from({length: 10}, (_, i) => ({
        clue: 2024 - i,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/awards/ap-offensive-rookie-of-the-year-award.htm"
    },
    {
      type: 'list',
      title: 'NFL Defensive Rookie of the Year',
      description: 'List the NFL Defensive Rookies of the Year (2015-2024).',
      items: Array.from({length: 10}, (_, i) => ({
        clue: 2024 - i,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/awards/ap-defensive-rookie-of-the-year-award.htm"
    },
    {
      type: 'list',
      title: 'NFL Comeback Player of the Year',
      description: 'List the NFL Comeback Players of the Year (2015-2024).',
      items: Array.from({length: 10}, (_, i) => ({
        clue: 2024 - i,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/awards/ap-comeback-player-award.htm"
    },
    {
      type: 'matchup',
      title: 'Last 10 AFC Championship Games',
      description: 'Fill in the teams that played in each AFC Championship game.',
      items: [
        { centerText: 'vs', context: '2024' },
        { centerText: 'vs', context: '2023' },
        { centerText: 'vs', context: '2022' },
        { centerText: 'vs', context: '2021' },
        { centerText: 'vs', context: '2020' },
        { centerText: 'vs', context: '2019' },
        { centerText: 'vs', context: '2018' },
        { centerText: 'vs', context: '2017' },
        { centerText: 'vs', context: '2016' },
        { centerText: 'vs', context: '2015' }
      ],
      columns: 2,
      answerKeyUrl: "https://www.statmuse.com/nfl/ask/last-10-afc-championship-games"
    },
    {
      type: 'matchup',
      title: 'Last 10 NFC Championship Games',
      description: 'Fill in the teams that played in each NFC Championship game.',
      items: [
        { centerText: 'vs', context: '2024' },
        { centerText: 'vs', context: '2023' },
        { centerText: 'vs', context: '2022' },
        { centerText: 'vs', context: '2021' },
        { centerText: 'vs', context: '2020' },
        { centerText: 'vs', context: '2019' },
        { centerText: 'vs', context: '2018' },
        { centerText: 'vs', context: '2017' },
        { centerText: 'vs', context: '2016' },
        { centerText: 'vs', context: '2015' }
      ],
      columns: 2,
      answerKeyUrl: "https://www.statmuse.com/nfl/ask/last-10-nfc-championship-games"
    },
    {
      type: 'matchup',
      title: 'Super Bowl Matchups by Score',
      description: 'Name the teams that played in these Super Bowls based on the final score.',
      items: [
        { centerText: '31-17', context: 'Super Bowl LVIII (2024)' },
        { centerText: '38-35', context: 'Super Bowl LVII (2023)' },
        { centerText: '23-20', context: 'Super Bowl LVI (2022)' },
        { centerText: '31-9', context: 'Super Bowl LV (2021)' },
        { centerText: '31-20', context: 'Super Bowl LIV (2020)' },
        { centerText: '13-3', context: 'Super Bowl LIII (2019)' }
      ],
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/super-bowl/",
      actionContent: {
        content: "Some of these were nail-biters, others were blowouts!",
        position: 'right',
        rotation: -2,
        icon: '🏆'
      }
    },
    {
      type: 'list',
      title: 'NFL All-Time Touchdown Leaders',
      description: 'List the top 20 all-time NFL touchdown leaders.',
      items: Array.from({length: 20}, (_, i) => ({
        clue: `#${i + 1}`,
      })),
      columns: 1,
      answerKeyUrl: "https://www.espn.com/nfl/history/leaders",
      actionContent: {
        content: "Only one active player is on this list!",
        position: 'left',
        rotation: 2,
        icon: '🏃‍♂️'
      }
    },
    {
      type: 'list',
      title: 'Top 20 NFL Career Rushing Leaders',
      description: 'List the top 20 all-time NFL career rushing leaders.',
      items: Array.from({length: 20}, (_, i) => ({
        clue: `#${i + 1}`,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/leaders/rush_yds_career.htm",
      actionContent: {
        content: "There is one active player in this list",
        position: 'right',
        rotation: -1,
        icon: '🏃‍♂️'
      }
    },
    {
      type: 'list',
      title: 'Top 20 Single Season NFL Rushing Records',
      description: 'List the top 20 single season NFL rushing records.',
      items: Array.from({length: 20}, (_, i) => ({
        clue: `#${i + 1}`,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/leaders/rush_yds_single_season.htm",
      actionContent: {
        content: "2 RBs show up twice and there is a tie at #12",
        position: 'left',
        rotation: -3,
        icon: '🏃‍♂️'
      }
    },
    {
      type: 'list',
      title: 'Top 20 NFL Career Receiving Yards Leaders',
      description: 'List the top 20 all-time NFL career receiving yards leaders.',
      items: Array.from({length: 20}, (_, i) => ({
        clue: `#${i + 1}`,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/leaders/rec_yds_career.htm",
      actionContent: {
        content: "Only one active player",
        position: 'right',
        rotation: 2,
        icon: '🏈'
      }
    },
    {
      type: 'list',
      title: 'Top 20 Single Season NFL Receiving Yards Records',
      description: 'List the top 20 single season NFL receiving yards records.',
      items: Array.from({length: 20}, (_, i) => ({
        clue: `#${i + 1}`,
      })),
      columns: 1,
      answerKeyUrl: "https://www.pro-football-reference.com/leaders/rec_yds_single_season.htm"
    }
  ],
  
  getPageConfiguration(pageNum: number): PageConfiguration {
    const pageIndex = pageNum - 1; // Convert 1-based page number to 0-based array index
    if (pageIndex >= 0 && pageIndex < this.pages.length) {
      return this.pages[pageIndex];
    }
    return {
      type: 'text',
      content: `This is page ${pageNum} of our book. The content for this page is dynamically generated. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
      answerKeyUrl: `https://example.com/page-${pageNum}-answers`
    };
  },
  
  getAnswerKeyUrl(pageNum: number): string {
    const pageConfiguration = this.getPageConfiguration(pageNum);
    return pageConfiguration.answerKeyUrl || `https://example.com/page-${pageNum}-answers`;
  },
  
  pageExists(pageNum: number): boolean {
    return pageNum >= 1 && pageNum <= this.totalPages;
  }
};