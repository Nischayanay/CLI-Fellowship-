class Pb < Formula
  desc "Official CLI tool for interacting with the PromptBrain Context Engine"
  homepage "https://github.com/promptbrain/cli"
  url "https://github.com/promptbrain/cli/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "node@18"

  def install
    system "npm", "install", "--production", "--prefix", libexec
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system "#{bin}/pb", "--version"
  end
end
