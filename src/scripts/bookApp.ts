// @ts-ignore
import qrcode from 'qrcode-generator';

// Global config interface
declare global {
  interface Window {
    bookAppConfig?: {
      currentPage: number;
      answerKeyUrl: string;
    };
  }
}

class BookApp {
  private currentPage: number;
  private readonly totalPages: number = 100;
  private answerKeyUrl: string;

  constructor() {
    // Parse current page from URL: /barbooks/3/ -> 3
    const pathParts = window.location.pathname.split('/').filter(part => part !== '');
    const pageParam = pathParts[pathParts.length - 1];
    this.currentPage = parseInt(pageParam) || 1;
    this.answerKeyUrl = window.bookAppConfig?.answerKeyUrl || `https://example.com/page-${this.currentPage}-answers`;
    this.init();
  }

  private init(): void {
    this.setupPageInput();
    this.setupNavigationButtons();
    this.addPrintFooter(this.currentPage);
    this.addVisibleQRCode(this.currentPage);
  }

  private setupPageInput(): void {
    const goBtn = document.getElementById('go-to-page-btn') as HTMLButtonElement;
    const pageInput = document.getElementById('page-input') as HTMLInputElement;
    
    if (goBtn && pageInput) {
      goBtn.addEventListener('click', () => {
        const pageNum = parseInt(pageInput.value);
        if (pageNum && pageNum >= 1 && pageNum <= this.totalPages) {
          window.location.href = `/barbooks/${pageNum}/`;
          pageInput.value = '';
        }
      });
    }

    if (pageInput) {
      pageInput.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const btn = document.getElementById('go-to-page-btn') as HTMLButtonElement;
          if (btn) btn.click();
        }
      });
    }
  }

  private setupNavigationButtons(): void {
    const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
    const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          window.location.href = `/barbooks/${this.currentPage - 1}/`;
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < this.totalPages) {
          window.location.href = `/barbooks/${this.currentPage + 1}/`;
        }
      });
    }
  }

  private async addPrintFooter(pageNumber: number): Promise<void> {
    const existingFooter = document.querySelector('.print-footer');
    if (existingFooter) {
      existingFooter.remove();
    }

    const printFooter = document.createElement('div');
    printFooter.className = 'print-footer hidden print:flex print:w-full print:max-w-[5in] print:justify-between print:mx-auto print:h-16 print:my-4 print:items-center';
    
    const answerUrl = this.answerKeyUrl;
    
    try {
      // @ts-ignore
      const qr = qrcode(0, 'M');
      qr.addData(answerUrl);
      qr.make();
      
      const qrSvg = qr.createSvgTag(2, 1);
      const qrDiv = document.createElement('div');
      qrDiv.innerHTML = qrSvg;
      qrDiv.className = 'qr-code';
      qrDiv.style.width = '40px';
      qrDiv.style.height = '40px';
      qrDiv.className = 'pr-8';
      
      const leftSpan = document.createElement('span');
      const centerSpan = document.createElement('span');
      centerSpan.textContent = `Page ${pageNumber}`;
      
      printFooter.appendChild(leftSpan);
      printFooter.appendChild(centerSpan);
      printFooter.appendChild(qrDiv);
    } catch (error) {
      console.error('QR Code generation failed:', error);
      printFooter.innerHTML = `
        <span>Page ${pageNumber}</span>
        <span>Answer Key: Error</span>
      `;
    }
    
    document.body.appendChild(printFooter);
  }

  private async addVisibleQRCode(pageNumber: number): Promise<void> {
    // Add QR code to center section of footer
    const centerSection = document.querySelector('footer .container > div > div:nth-child(2)');
    if (!centerSection) return;
    
    const existingQR = document.querySelector('.footer-qr');
    if (existingQR) {
      existingQR.remove();
    }
    
    const footerQR = document.createElement('div');
    footerQR.className = 'footer-qr flex items-center space-x-1 print:hidden';
    
    const answerUrl = this.answerKeyUrl;
    
    footerQR.innerHTML = `
      <div id="footer-qr-canvas"></div>
    `;
    
    // Add to the center section alongside the page number
    centerSection.appendChild(footerQR);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // @ts-ignore
      const qr = qrcode(0, 'M');
      qr.addData(answerUrl);
      qr.make();
      
      const qrSvg = qr.createSvgTag(4, 2);
      
      const qrContainer = document.createElement('div');
      qrContainer.innerHTML = qrSvg;
      qrContainer.style.width = '32px';
      qrContainer.style.height = '32px';
      
      const footerCanvas = document.getElementById('footer-qr-canvas');
      if (footerCanvas) {
        footerCanvas.appendChild(qrContainer);
      }
      console.log('QR Code generated successfully for:', answerUrl);
    } catch (error) {
      console.error('QR Code generation failed:', error);
      const footerCanvas = document.getElementById('footer-qr-canvas');
      if (footerCanvas) {
        footerCanvas.innerHTML = `
          <div class="w-8 h-8 bg-red-200 flex items-center justify-center border rounded">
            <a href="${answerUrl}" target="_blank" class="text-xs text-center">!</a>
          </div>
        `;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BookApp();
});