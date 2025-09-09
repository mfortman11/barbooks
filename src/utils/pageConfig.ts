import type { PageConfiguration } from './pageTypes.js';

interface PageConfig {
  totalPages: number;
  pages: Record<number, PageConfiguration>;
  getPageConfiguration(pageNum: number): PageConfiguration;
  getAnswerKeyUrl(pageNum: number): string;
  pageExists(pageNum: number): boolean;
}

export const pageConfig: PageConfig = {
  totalPages: 100,
  
  pages: {
    1: {
      type: 'list',
      title: 'NFL MVP Challenge',
      description: 'List the NFL Most Valuable Players (2000-2024). Write the player\'s name on each line.',
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
    2: {
      type: 'text',
      content: "On the second page, our journey continues as we meet the protagonists and learn about their world filled with mystery and wonder.",
      answerKeyUrl: "https://example.com/page-2-answers"
    },
    3: {
      type: 'list',
      title: 'Top 10 Movies of All Time',
      description: 'Name the top 10 movies according to IMDb rankings.',
      items: Array.from({length: 10}, (_, i) => ({
        clue: `#${i + 1}`  // Ranking numbers
      })),
      columns: 1,
      answerKeyUrl: "https://www.imdb.com/chart/top/"
    },
    4: {
      type: 'list', 
      title: 'Chemical Elements',
      description: 'Write the chemical symbol for each element.',
      items: [
        { clue: 'Hydrogen' },
        { clue: 'Helium' },
        { clue: 'Lithium' },
        { clue: 'Beryllium' },
        { clue: 'Boron' },
        { clue: 'Carbon' },
        { clue: 'Nitrogen' },
        { clue: 'Oxygen' },
        { clue: 'Fluorine' },
        { clue: 'Neon' }
      ],
      columns: 2,
      answerKeyUrl: "https://en.wikipedia.org/wiki/Periodic_table"
    },
    5: {
      type: 'list',
      title: 'NBA Champions by Year',
      description: 'List the NBA Championship winners from 2015-2024.',
      items: Array.from({length: 10}, (_, i) => ({
        clue: 2024 - i  // Years as numbers
      })),
      columns: 2,
      answerKeyUrl: "https://www.basketball-reference.com/playoffs/"
    },
    6: {
      type: 'list',
      title: 'World Capitals',
      description: 'Write the capital city for each country.',
      items: [
        { clue: 'France' },
        { clue: 'Germany' },
        { clue: 'Italy' },
        { clue: 'Spain' },
        { clue: 'Japan' },
        { clue: 'Australia' },
        { clue: 'Brazil' },
        { clue: 'Canada' },
        { clue: 'India' },
        { clue: 'Egypt' }
      ],
      columns: 2,
      answerKeyUrl: "https://www.countries-ofthe-world.com/capitals-of-the-world.html"
    },
    7: {
      type: 'list',
      title: 'Math Quiz',
      description: 'Solve these mathematical expressions.',
      items: [
        { clue: '7 × 8' },
        { clue: '144 ÷ 12' },
        { clue: '15 + 27' },
        { clue: '100 - 63' },
        { clue: '9²' },
        { clue: '√64' },
        { clue: '25% of 80' },
        { clue: '3³' }
      ],
      columns: 2,
      answerKeyUrl: "https://example.com/math-answers"
    },
    8: {
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
      answerKeyUrl: "https://www.pro-football-reference.com/years/2024/playoffs.htm"
    },
    9: {
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
    }
  },
  
  getPageConfiguration(pageNum: number): PageConfiguration {
    if (this.pages[pageNum]) {
      return this.pages[pageNum];
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