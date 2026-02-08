module ButtonAttachableResolver
  def from_node(node)
    Renderer::ButtonBlock.from_node(node) || super
  end
end

Rails.application.config.to_prepare do
  unless ActionText::Attachable.singleton_class.ancestors.include?(ButtonAttachableResolver)
    ActionText::Attachable.singleton_class.prepend(ButtonAttachableResolver)
  end
end
