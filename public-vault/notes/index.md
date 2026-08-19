---
title: All Notes
layout: base
---

# All Notes

<ul>
{% for post in collections.posts %}
<li class="mb-4 p-4 bg-gray-800 rounded-lg">
  <a href="{{ post.url }}" class="text-blue-400 text-lg">
    {{ post.data.title }}
  </a>
</li>
{% endfor %}
</ul>